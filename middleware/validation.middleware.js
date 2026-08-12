const mongoose = require("mongoose");
const { AppError } = require("./error.middleware");

const REQUIRED_FIELDS = [
  "name",
  "clientName",
  "totalTasks",
  "completedTasks",
  "rejectedTasks",
  "daysRemaining",
  "dailyAverage",
  "vendorFailureRate",
  "activeAgents",
  "targetCompletionDate",
];

/**
 * Validates the request body for campaign creation before it reaches the
 * controller/model layer. Mongoose validators still run as a second line of
 * defense, but this gives clearer, field-specific error messages early.
 */
const validateCampaignInput = (req, res, next) => {
  const body = req.body;
  const missing = REQUIRED_FIELDS.filter(
    (field) => body[field] === undefined || body[field] === null || body[field] === ""
  );

  if (missing.length > 0) {
    return next(new AppError(`Missing required fields: ${missing.join(", ")}`, 400));
  }

  const numericFields = [
    "totalTasks",
    "completedTasks",
    "rejectedTasks",
    "daysRemaining",
    "dailyAverage",
    "vendorFailureRate",
    "activeAgents",
  ];

  for (const field of numericFields) {
    if (typeof body[field] !== "number" || Number.isNaN(body[field])) {
      return next(new AppError(`${field} must be a valid number`, 400));
    }
  }

  if (body.totalTasks <= 0) {
    return next(new AppError("totalTasks must be greater than 0", 400));
  }

  if (body.completedTasks > body.totalTasks) {
    return next(new AppError("completedTasks cannot exceed totalTasks", 400));
  }

  if (body.rejectedTasks > body.completedTasks) {
    return next(new AppError("rejectedTasks cannot exceed completedTasks", 400));
  }

  if (body.daysRemaining < 0) {
    return next(new AppError("daysRemaining cannot be negative", 400));
  }

  if (body.dailyAverage < 0) {
    return next(new AppError("dailyAverage cannot be negative", 400));
  }

  if (body.vendorFailureRate < 0 || body.vendorFailureRate > 1) {
    return next(new AppError("vendorFailureRate must be between 0 and 1", 400));
  }

  if (body.activeAgents < 0) {
    return next(new AppError("activeAgents cannot be negative", 400));
  }

  if (Number.isNaN(Date.parse(body.targetCompletionDate))) {
    return next(new AppError("targetCompletionDate must be a valid date", 400));
  }

  next();
};

/**
 * Validates that :id route params are well-formed MongoDB ObjectIds before
 * hitting the database, producing a clean 400 instead of a CastError.
 */
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError(`Invalid ID format: ${req.params.id}`, 400));
  }
  next();
};

module.exports = { validateCampaignInput, validateObjectId };
