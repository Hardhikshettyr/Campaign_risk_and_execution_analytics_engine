const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Campaign name is required"],
      trim: true,
      minlength: [3, "Campaign name must be at least 3 characters long"],
    },
    clientName: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
      
      index: true,
    },
    totalTasks: {
      type: Number,
      required: [true, "totalTasks is required"],
      validate: {
        validator: (value) => value > 0,
        message: "totalTasks must be greater than 0",
      },
    },
    completedTasks: {
      type: Number,
      required: [true, "completedTasks is required"],
      min: [0, "completedTasks cannot be negative"],
      validate: {
        validator: function (value) {
          // `this` refers to the document being validated. On findOneAndUpdate
          // this validator is skipped unless runValidators + context:'query' is
          // used with an explicit reference to totalTasks (handled in controller).
          return value <= this.totalTasks;
        },
        message: "completedTasks cannot exceed totalTasks",
      },
    },
    rejectedTasks: {
      type: Number,
      required: [true, "rejectedTasks is required"],
      min: [0, "rejectedTasks cannot be negative"],
      validate: {
        validator: function (value) {
          return value <= this.completedTasks;
        },
        message: "rejectedTasks cannot exceed completedTasks",
      },
    },
    daysRemaining: {
      type: Number,
      required: [true, "daysRemaining is required"],
      min: [0, "daysRemaining cannot be negative"],
    },
    dailyAverage: {
      type: Number,
      required: [true, "dailyAverage is required"],
      min: [0, "dailyAverage cannot be negative"],
    },
    vendorFailureRate: {
      type: Number,
      required: [true, "vendorFailureRate is required"],
      min: [0, "vendorFailureRate must be between 0 and 1"],
      max: [1, "vendorFailureRate must be between 0 and 1"],
    },
    activeAgents: {
      type: Number,
      required: [true, "activeAgents is required"],
      min: [0, "activeAgents cannot be negative"],
    },
    targetCompletionDate: {
      type: Date,
      required: [true, "targetCompletionDate is required"],
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

// Common query patterns: filtering by client, sorting by target date / creation date.
campaignSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Campaign", campaignSchema);
