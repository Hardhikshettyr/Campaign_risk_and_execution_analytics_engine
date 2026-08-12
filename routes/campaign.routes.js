const express = require("express");
const router = express.Router();

const {
  createCampaign,
  getCampaigns,
  getCampaignById,
  getCampaignRisk,
  getCampaignRecommendations,
  getCampaignAnalysis,
} = require("../controllers/campaign.controller");

const { validateCampaignInput, validateObjectId } = require("../middleware/validation.middleware");

router.post("/", validateCampaignInput, createCampaign);
router.get("/", getCampaigns);
router.get("/:id", validateObjectId, getCampaignById);
router.get("/:id/risk", validateObjectId, getCampaignRisk);
router.get("/:id/recommendations", validateObjectId, getCampaignRecommendations);
router.get("/:id/analysis", validateObjectId, getCampaignAnalysis);

module.exports = router;
