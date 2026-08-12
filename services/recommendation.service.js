/**
 * Generates actionable recommendations dynamically from the risk analysis
 * output. Each rule inspects the same factor breakdown / metrics produced
 * by risk.service.js, so recommendations always stay consistent with the
 * reasons a campaign was flagged as risky.
 */

const generateRecommendations = (campaign, riskAnalysis) => {
  const recommendations = [];
  const { factorBreakdown, deadlinePassed, executionSufficient, rejectionRate } = riskAnalysis;

  if (deadlinePassed) {
    recommendations.push(
      "Deadline has passed — escalate immediately and renegotiate the target completion date."
    );
  } else if (!executionSufficient && factorBreakdown.executionGapFactor > 0.15) {
    recommendations.push("Increase the number of active field agents.");
    recommendations.push("Extend working hours or add shifts to close the execution gap.");
  }

  if (factorBreakdown.rejectionRateFactor > 0.3) {
    recommendations.push("Review rejected proofs and investigate recurring rejection reasons.");
    if (rejectionRate > 15) {
      recommendations.push("Provide refresher training to agents with high rejection counts.");
    }
  }

  if (factorBreakdown.vendorFailureFactor > 0.3) {
    recommendations.push("Review vendor performance or redistribute tasks to reliable vendors.");
  }

  if (factorBreakdown.deadlinePressureFactor > 0.5) {
    recommendations.push("Prioritize incomplete high-priority locations.");
  }

  if (factorBreakdown.completionRateFactor > 0.6) {
    recommendations.push(
      "Conduct a status review with the client early, given the low overall completion rate."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("Campaign is on track — continue monitoring at the current pace.");
  }

  return recommendations;
};

module.exports = { generateRecommendations };
