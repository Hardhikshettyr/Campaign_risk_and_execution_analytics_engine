/**
 * Rounds a number to a fixed number of decimal places while avoiding
 * floating point artifacts (e.g. 33.333333333333336 -> 33.33).
 */
const round = (value, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

/**
 * Safely divides two numbers, returning a fallback value (default 0)
 * whenever the denominator is zero, to avoid NaN/Infinity propagating
 * through the risk and prediction calculations.
 */
const safeDivide = (numerator, denominator, fallback = 0) => {
  if (!denominator || denominator === 0) return fallback;
  return numerator / denominator;
};

/**
 * Clamps a value between a minimum and maximum bound.
 */
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

module.exports = { round, safeDivide, clamp };
