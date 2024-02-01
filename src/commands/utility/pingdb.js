const { SlashCommandBuilder } = require('@discordjs/builders');
const { pool } = require('../../util/db');
const { chalk, logs, errlogs } = require('../../util/ez_log');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('pingdb')
        .setDescription('Admin Debug only - Tests the connection to the database'),
    async execute(interaction) {
        // Check if the user is an administrator
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply('You must be an administrator to use this command.');
        }
        // PostgreSQL pool connection
        try {
            await pool.query('SELECT NOW()');
            await interaction.reply('Successfully connected to the database!');
            await logs(chalk.green('Successfully connected to the database at:'), new Date().toISOString().slice(11, 19));
            pool.end();
        } catch (error) {
            console.error(error);
            await interaction.reply('Failed to connect to the database.');
            await errlogs(chalk.red('Failed to connect to the database at:'), new Date().toISOString().slice(11, 19));
        }
    }, 
};
