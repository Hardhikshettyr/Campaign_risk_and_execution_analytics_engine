require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Campaign = require("../models/campaign.model");

const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

// 8 campaigns: 2 LOW risk, 3 MEDIUM risk, 3 HIGH risk (verified against
// services/risk.service.js's scoring logic).
const campaigns = [
  {
    name: "Metro Grocery Chain - Store Poster Rollout",
    clientName: "Metro Grocery Chain",
    totalTasks: 1000,
    completedTasks: 850,
    rejectedTasks: 20,
    daysRemaining: 20,
    dailyAverage: 60,
    vendorFailureRate: 0.02,
    activeAgents: 40,
    targetCompletionDate: addDays(20),
  },
  {
    name: "Sunrise Telecom - Retail Standee Placement",
    clientName: "Sunrise Telecom",
    totalTasks: 500,
    completedTasks: 400,
    rejectedTasks: 10,
    daysRemaining: 15,
    dailyAverage: 30,
    vendorFailureRate: 0.05,
    activeAgents: 20,
    targetCompletionDate: addDays(15),
  },
  {
    name: "Coastal Bank - Branch Signage Refresh",
    clientName: "Coastal Bank",
    totalTasks: 1200,
    completedTasks: 540,
    rejectedTasks: 70,
    daysRemaining: 9,
    dailyAverage: 35,
    vendorFailureRate: 0.18,
    activeAgents: 22,
    targetCompletionDate: addDays(9),
  },
  {
    name: "Zenith Motors - Dealership Banner Drive",
    clientName: "Zenith Motors",
    totalTasks: 800,
    completedTasks: 350,
    rejectedTasks: 45,
    daysRemaining: 8,
    dailyAverage: 35,
    vendorFailureRate: 0.1,
    activeAgents: 18,
    targetCompletionDate: addDays(8),
  },
  {
    name: "Brightline Foods - Wholesale Shelf Audit",
    clientName: "Brightline Foods",
    totalTasks: 2000,
    completedTasks: 1000,
    rejectedTasks: 150,
    daysRemaining: 8,
    dailyAverage: 55,
    vendorFailureRate: 0.22,
    activeAgents: 28,
    targetCompletionDate: addDays(8),
  },
  {
    name: "Alpine Beverages - Highway Hoarding Campaign",
    clientName: "Alpine Beverages",
    totalTasks: 1000,
    completedTasks: 620,
    rejectedTasks: 90,
    daysRemaining: 3,
    dailyAverage: 25,
    vendorFailureRate: 0.3,
    activeAgents: 15,
    targetCompletionDate: addDays(3),
  },
  {
    name: "Pioneer Electronics - Multi-City Kiosk Setup",
    clientName: "Pioneer Electronics",
    totalTasks: 1500,
    completedTasks: 400,
    rejectedTasks: 70,
    daysRemaining: 5,
    dailyAverage: 20,
    vendorFailureRate: 0.35,
    activeAgents: 10,
    targetCompletionDate: addDays(5),
  },
  {
    name: "Harvest Organics - Rural Market Activation",
    clientName: "Harvest Organics",
    totalTasks: 900,
    completedTasks: 850,
    rejectedTasks: 60,
    daysRemaining: 0,
    dailyAverage: 10,
    vendorFailureRate: 0.4,
    activeAgents: 5,
    targetCompletionDate: addDays(0),
  },
];

const seed = async () => {
  await connectDB();
  await Campaign.deleteMany({});
  const created = await Campaign.insertMany(campaigns);
  console.log(`Seeded ${created.length} campaigns.`);
  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
