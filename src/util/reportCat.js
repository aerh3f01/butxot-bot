const dotenv = require('dotenv');
dotenv.config();

const incomingReports = process.env.INCOMING_REPORTS_ID;
const priorityCategory = process.env.PRIORITY_CATEGORY;
const mediumCategory = process.env.MEDIUM_CATEGORY;
const generalCategory = process.env.GENERAL_CATEGORY;

module.exports = {
    incomingReports,
    priorityCategory,
    mediumCategory,
    generalCategory
};