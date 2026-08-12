const Campaign = require("../models/campaign.model");
const { asyncHandler, AppError } = require("../middleware/error.middleware");
const riskService = require("../services/risk.service");
const recommendationService = require("../services/recommendation.service");

/**
 * POST /api/campaigns
 * Creates a new campaign.
 */
const createCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.create(req.body);
  res.status(201).json({ success: true, data: campaign });
});

/**
 * GET /api/campaigns
 * Returns all campaigns, most recently created first.
 */
const getCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await Campaign.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: campaigns });
});

/**
 * Shared helper: fetches a campaign by ID or throws a 404 AppError.
 */
const findCampaignOrThrow = async (id) => {
  const campaign = await Campaign.findById(id);
  if (!campaign) {
    throw new AppError("Campaign not found", 404);
  }
  return campaign;
};

/**
 * GET /api/campaigns/:id
 */
const getCampaignById = asyncHandler(async (req, res) => {
  const campaign = await findCampaignOrThrow(req.params.id);
  res.status(200).json({ success: true, data: campaign });
});

/**
 * GET /api/campaigns/:id/risk
 */
const getCampaignRisk = asyncHandler(async (req, res) => {
  const campaign = await findCampaignOrThrow(req.params.id);
  const risk = riskService.analyzeRisk(campaign);
  res.status(200).json({ success: true, data: risk });
});

/**
 * GET /api/campaigns/:id/recommendations
 */
const getCampaignRecommendations = asyncHandler(async (req, res) => {
  const campaign = await findCampaignOrThrow(req.params.id);
  const risk = riskService.analyzeRisk(campaign);
  const recommendations = recommendationService.generateRecommendations(campaign, risk);

  res.status(200).json({
    success: true,
    data: {
      campaignId: campaign._id,
      risk: risk.risk,
      recommendations,
    },
  });
});

/**
 * GET /api/campaigns/:id/analysis
 * Combined endpoint: campaign + risk + prediction + recommendations.
 */
const getCampaignAnalysis = asyncHandler(async (req, res) => {
  const campaign = await findCampaignOrThrow(req.params.id);
  const risk = riskService.analyzeRisk(campaign);
  const prediction = riskService.predictCompletion(campaign);
  const recommendations = recommendationService.generateRecommendations(campaign, risk);

  res.status(200).json({
    success: true,
    data: {
      campaign,
      risk,
      prediction,
      recommendations,
    },
  });
});

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById,
  getCampaignRisk,
  getCampaignRecommendations,
  getCampaignAnalysis,
};
