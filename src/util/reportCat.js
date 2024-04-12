const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config.json');

// Enhanced error handling for loading config
let config;
try {
  const configRaw = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configRaw);
} catch (error) {
  console.error("Failed to load config:", error);
  config = {}; // Provide a fallback object
}

// Extracting category IDs and incoming reports ID from the config
const { incomingReportsChannel, modCategory, priorityCategory, mediumCategory, generalCategory, closedCategory } = config;

module.exports = {
    incomingReportsChannel,
    modCategory,
    priorityCategory,
    mediumCategory,
    generalCategory,
    closedCategory
};

