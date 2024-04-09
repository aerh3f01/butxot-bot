const { SlashCommandBuilder } = require('@discordjs/builders');
const { pool } = require('../../util/db');
const { chalk, logs, errlogs } = require('../../util/ez_log');
const { isAdmin } = require('../../util/admins');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('pingdb')
        .setDescription('Admin Debug only - Tests the connection to the database'),
    async execute(interaction) {
        // Check if the user is an administrator
        const member = interaction.member;
        const memberId = member.id;
        const memberPermissions = member.permissions;
        
        if (!await isAdmin(member, memberId, memberPermissions)) {
            return interaction.reply({ content: 'Sorry, you do not have the required permissions to use this command.', ephemeral: true });
        }

        // PostgreSQL pool connection
        try {
            await pool.query('SELECT NOW()');
            await interaction.reply('Successfully connected to the database!');
            await logs(chalk.green('Successfully connected to the database at:'), new Date().toISOString().slice(11, 19));
        } catch (error) {
            console.error(error);
            await interaction.reply('Failed to connect to the database.');
            await errlogs(chalk.red('Failed to connect to the database at:'), new Date().toISOString().slice(11, 19));
        }
    }, 
};
