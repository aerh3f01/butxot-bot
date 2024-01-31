const { SlashCommandBuilder } = require('@discordjs/builders');
const { Pool } = require('pg');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('pingdb')
        .setDescription('Tests the connection to the database'),
    async execute(interaction) {
        // PostgreSQL pool connection
        const pool = new Pool({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_DATABASE,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
        });

        try {
            await pool.connect();
            await interaction.reply('Successfully connected to the database!');
            pool.end();
        } catch (error) {
            console.error(error);
            await interaction.reply('Failed to connect to the database.');
        }
    }, 
};
