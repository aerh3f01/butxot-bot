const { Permissions } = require('discord.js');
const { logs, chalk } = require('./ez_log');
const dotenv  = require('dotenv');

dotenv.config();

// Grab the admin role IDs from the .env file
const adminRoleIds = process.env.ADMIN_ROLE_IDS.split(',');
const ownerid = process.env.OWNER_ID;

async function isAdmin(member, memberId, memberPermissions) {
    
    // Check if the user is the bot owner
    if (memberId === ownerid) {
        logs(chalk.blue(`User ${member} is the bot owner`));
        return true;
    }

    // Check if the user has Administrator permission
    else if (memberPermissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
        logs(chalk.blue('User has the Administrator permission'));
        return true;
    }
    else if (memberPermissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
        logs(chalk.blue('User has the Manage Guild permission'));
        return true;
    }
    
    else if (member.roles.cache.some(role => adminRoleIds.includes(role.id))) {
        logs(chalk.blue('User has the required role'));
        return true;
    }
    else {
        logs(chalk.purple('User does not have the required permissions'));
        return false;
    }
}

module.exports = isAdmin;
