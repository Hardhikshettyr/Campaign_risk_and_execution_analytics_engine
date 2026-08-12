const { round, safeDivide, clamp } = require("../utils/risk.utils");

/**
 * ---------------------------------------------------------------------------
 * RISK SCORING METHODOLOGY (rule-based, explainable — NOT machine learning)
 * ---------------------------------------------------------------------------
 * The final riskScore (0-100) is a weighted sum of five independent 0-1
 * "factor" scores. Each factor captures one dimension of campaign health.
 * Weights were chosen manually based on operational judgement about which
 * signals most directly predict a missed deadline. They are documented here
 * so they can be tuned, or eventually learned from real historical data.
 *
 *   Factor                  Weight   Rationale
 *   -----------------------------------------------------------------------
 *   Execution Gap            0.35    Directly measures whether the current
 *                                    pace can physically finish the work.
 *                                    This is the single strongest predictor
 *                                    of missing a deadline, hence the
 *                                    largest weight.
 *   Deadline Pressure         0.20   Even if pace looks fine today, very few
 *                                    days remaining leaves no room to absorb
 *                                    disruptions (vendor issues, weather,
 *                                    agent dropouts).
 *   Completion Rate           0.15   A campaign that has completed very
 *                                    little of its total work is inherently
 *                                    more exposed to unknown risks later.
 *   Rejection Rate             0.15   High rejection rates mean completed
 *                                    work isn't actually usable, silently
 *                                    inflating "completed" numbers.
 *   Vendor Failure Rate        0.15   Historical vendor unreliability is a
 *                                    leading indicator of future execution
 *                                    problems.
 *   -----------------------------------------------------------------------
 *   Total weight = 1.00 -> riskScore = round(100 * weighted sum of factors)
 *
 * Risk bands:
 *   0–30   = LOW
 *   31–60  = MEDIUM
 *   61–100 = HIGH
 * ---------------------------------------------------------------------------
 */

const WEIGHTS = {
  executionGap: 0.35,
  deadlinePressure: 0.2,
  completionRate: 0.15,
  rejectionRate: 0.15,
  vendorFailureRate: 0.15,
};

// Baseline assumption used only for the deadline-pressure factor: a campaign
// with 14+ days remaining is considered to have comfortable schedule buffer.
const DEADLINE_PRESSURE_BASELINE_DAYS = 14;

// A rejection rate of 25% or higher is treated as maximally risky for the
// purposes of the rejection-rate factor.
const REJECTION_RATE_SATURATION_POINT = 25;

/**
 * Computes the core derived metrics for a campaign: completion rate,
 * remaining tasks, required daily rate, rejection rate, and whether the
 * current execution pace is sufficient.
 */
const computeMetrics = (campaign) => {
  const {
    totalTasks,
    completedTasks,
    rejectedTasks,
    daysRemaining,
    dailyAverage,
    vendorFailureRate,
  } = campaign;

  const completionRate = round(safeDivide(completedTasks, totalTasks, 0) * 100);
  const remainingTasks = Math.max(totalTasks - completedTasks, 0);

  // Edge case: daysRemaining === 0. If there is still remaining work, the
  // required pace is effectively infinite/unreachable; we flag this
  // explicitly rather than dividing by zero.
  const deadlinePassed = daysRemaining === 0 && remainingTasks > 0;
  const requiredDailyRate = deadlinePassed
    ? null
    : round(safeDivide(remainingTasks, daysRemaining, 0));

  // Edge case: completedTasks === 0 -> rejection rate is 0 by definition
  // (nothing has been reviewed yet), not undefined.
  const rejectionRate = round(safeDivide(rejectedTasks, completedTasks, 0) * 100);

  const executionSufficient = deadlinePassed
    ? false
    : requiredDailyRate <= dailyAverage;

  return {
    completionRate,
    remainingTasks,
    requiredDailyRate,
    deadlinePassed,
    rejectionRate,
    executionSufficient,
    vendorFailureRate,
  };
};

/**
 * Converts raw metrics into normalized 0-1 risk factors.
 */
const computeFactors = (campaign, metrics) => {
  const { daysRemaining, dailyAverage, vendorFailureRate } = campaign;
  const { remainingTasks, requiredDailyRate, deadlinePassed, completionRate, rejectionRate } =
    metrics;

  // Execution gap factor: how far short the current pace falls relative to
  // what's required. 0 = on pace or ahead, 1 = deadline already passed with
  // work remaining, or pace is at/near zero against real remaining work.
  let executionGapFactor;
  if (remainingTasks === 0) {
    executionGapFactor = 0; // campaign already complete
  } else if (deadlinePassed) {
    executionGapFactor = 1;
  } else if (requiredDailyRate <= dailyAverage) {
    executionGapFactor = 0;
  } else {
    // Proportional shortfall, clamped to [0,1]. If dailyAverage is 0 while
    // requiredDailyRate > 0, this correctly evaluates to 1 (maximum risk).
    executionGapFactor = clamp(
      safeDivide(requiredDailyRate - dailyAverage, requiredDailyRate, 1),
      0,
      1
    );
  }

  // Deadline pressure factor: scales linearly from 0 (>= baseline days left)
  // to 1 (0 days left).
  const deadlinePressureFactor = clamp(
    1 - daysRemaining / DEADLINE_PRESSURE_BASELINE_DAYS,
    0,
    1
  );

  // Completion rate factor: inverse of completion percentage.
  const completionRateFactor = clamp(1 - completionRate / 100, 0, 1);

  // Rejection rate factor: saturates at REJECTION_RATE_SATURATION_POINT.
  const rejectionRateFactor = clamp(
    rejectionRate / REJECTION_RATE_SATURATION_POINT,
    0,
    1
  );

  // Vendor failure rate is already stored as a 0-1 fraction.
  const vendorFailureFactor = clamp(vendorFailureRate, 0, 1);

  return {
    executionGapFactor,
    deadlinePressureFactor,
    completionRateFactor,
    rejectionRateFactor,
    vendorFailureFactor,
  };
};

/**
 * Maps a numeric riskScore (0-100) to a LOW / MEDIUM / HIGH band.
 */
const getRiskBand = (riskScore) => {
  if (riskScore <= 30) return "LOW";
  if (riskScore <= 60) return "MEDIUM";
  return "HIGH";
};

/**
 * Produces human-readable explanations for which factors are driving risk.
 * Thresholds are intentionally generous so the explanations stay focused on
 * factors that are meaningfully contributing, not just nonzero.
 */
const buildRiskFactorMessages = (metrics, factors) => {
  const messages = [];

  if (metrics.deadlinePassed) {
    messages.push("Deadline has already passed with tasks still remaining.");
  } else if (factors.executionGapFactor > 0.15) {
    messages.push("Current execution rate is below the required daily rate.");
  }

  if (factors.deadlinePressureFactor > 0.5) {
    messages.push("High deadline pressure due to very few days remaining.");
  }

  if (factors.completionRateFactor > 0.6) {
    messages.push("Overall completion rate is low relative to total tasks.");
  }

  if (factors.rejectionRateFactor > 0.3) {
    messages.push("High rejection rate among completed tasks.");
  }

  if (factors.vendorFailureFactor > 0.3) {
    messages.push("High vendor failure rate.");
  }

  if (messages.length === 0) {
    messages.push("No significant risk factors detected; campaign is on track.");
  }

  return messages;
};

/**
 * Main entry point: computes the full risk analysis for a campaign document
 * (or plain object with the same shape).
 */
const analyzeRisk = (campaign) => {
  const metrics = computeMetrics(campaign);
  const factors = computeFactors(campaign, metrics);

  const weightedSum =
    factors.executionGapFactor * WEIGHTS.executionGap +
    factors.deadlinePressureFactor * WEIGHTS.deadlinePressure +
    factors.completionRateFactor * WEIGHTS.completionRate +
    factors.rejectionRateFactor * WEIGHTS.rejectionRate +
    factors.vendorFailureFactor * WEIGHTS.vendorFailureRate;

  const riskScore = clamp(Math.round(weightedSum * 100), 0, 100);
  const risk = getRiskBand(riskScore);
  const riskFactors = buildRiskFactorMessages(metrics, factors);

  return {
    risk,
    riskScore,
    completionRate: metrics.completionRate,
    remainingTasks: metrics.remainingTasks,
    requiredDailyRate: metrics.requiredDailyRate,
    rejectionRate: metrics.rejectionRate,
    deadlinePassed: metrics.deadlinePassed,
    executionSufficient: metrics.executionSufficient,
    riskFactors,
    // Exposed for transparency / debugging in the interview demo; shows the
    // raw 0-1 factor values that fed into the weighted score.
    factorBreakdown: factors,
  };
};

/**
 * Rule-based completion projection (explicitly NOT machine learning).
 * Projects forward using the campaign's current daily average and the
 * number of days remaining.
 */
const predictCompletion = (campaign) => {
  const { totalTasks, completedTasks, dailyAverage, daysRemaining } = campaign;

  const predictedAdditionalTasksRaw = dailyAverage * daysRemaining;
  const predictedTotalCompletionRaw = completedTasks + predictedAdditionalTasksRaw;

  // Predicted completion can never exceed totalTasks.
  const predictedTotalCompletion = Math.min(predictedTotalCompletionRaw, totalTasks);
  const predictedAdditionalTasks = round(predictedTotalCompletion - completedTasks);

  const predictedCompletionPercentage = round(
    safeDivide(predictedTotalCompletion, totalTasks, 0) * 100
  );

  const predictedShortfall = round(Math.max(totalTasks - predictedTotalCompletion, 0));

  return {
    predictedAdditionalTasks,
    predictedTotalCompletion: round(predictedTotalCompletion),
    predictedCompletionPercentage,
    predictedShortfall,
    methodology: "rule-based-projection",
  };
};

module.exports = { analyzeRisk, predictCompletion, computeMetrics, computeFactors };
