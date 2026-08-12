const express = require("express");
const campaignRoutes = require("./routes/campaign.routes");
const { notFoundHandler, errorHandler } = require("./middleware/error.middleware");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Campaign Risk Engine API is running" });
});

app.use("/api/campaigns", campaignRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
