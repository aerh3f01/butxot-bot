const { SlashCommandBuilder } = require('@discordjs/builders');
const pool = require('../../util/db');
const { chalk, logs, errlogs } = require('../../util/ez_log');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('pingdb')
        .setDescription('Tests the connection to the database'),
    async execute(interaction) {
        // PostgreSQL pool connection
        try {
            await pool.connect();
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
