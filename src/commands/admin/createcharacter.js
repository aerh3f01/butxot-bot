const { SlashCommandBuilder } = require('@discordjs/builders');
const { WebhookClient } = require('discord.js');
const { pool } = require('../../util/db'); // Assuming you have a db.js file for handling the database connection

module.exports = {
    category: 'admin',
    data: new SlashCommandBuilder()
        .setName('createcharacter')
        .setDescription('Admin only - Creates a new character with an associated webhook')
        .addStringOption(option => 
            option.setName('name')
                .setDescription('Name of the character')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('display_name')
                .setDescription('Display name of the character')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('avatar_url')
                .setDescription('Avatar URL of the character')
                .setRequired(true))
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('Channel to create the webhook in')
                .setRequired(true)),
    async execute(interaction) {
        // Check if the user is an administrator
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply('You must be an administrator to use this command.');
        }
        const name = interaction.options.getString('name');
        const displayName = interaction.options.getString('display_name');
        const avatarUrl = interaction.options.getString('avatar_url');
        const channel = interaction.options.getChannel('channel');
        const creatorUser = interaction.user.tag;
        try {
            // Create a webhook
            const webhook = await channel.createWebhook({
                name: name,
                avatar: avatarUrl 
            });

            // Store character and webhook in the database
            const query = 'INSERT INTO characters (name, display_name, avatar_url, webhook, creator_username) VALUES ($1, $2, $3, $4, $5) RETURNING *';
            const values = [name, displayName, avatarUrl, webhook.url, creatorUser];
            const res = await pool.query(query, values);

            await interaction.reply(`Character created by ${creatorUser}: ${res.rows[0].display_name}`);
        } catch (err) {
            console.error(err);
            await interaction.reply('Failed to create character and webhook.');
        }
    },
};
