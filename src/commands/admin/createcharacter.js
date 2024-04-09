const { SlashCommandBuilder } = require('@discordjs/builders');
const { chalk, logs, errlogs } = require('../../util/ez_log');
const { pool } = require('../../util/db'); // Assuming you have a db.js file for handling the database connection
const isAdmin = require('../../util/admins');

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
        const member = interaction.member;
        const memberId = member.id;
        const memberPermissions = member.permissions;
       
        if (!await isAdmin(member, memberId, memberPermissions)) {
            return interaction.reply({ content: 'Sorry, you do not have the required permissions to use this command.', ephemeral: true });
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
            logs(chalk.blue(`Character created by user ${creatorUser} called ${name} - ${displayName}, at:`), new Date().toISOString().slice(11, 19));
            await interaction.reply(`Character created by ${creatorUser}: ${res.rows[0].display_name}`);
        } catch (err) {
            errlogs(chalk.red('Failed to create character and webhook at:'), new Date().toISOString().slice(11, 19));
            errlogs(err);
            await interaction.reply('Failed to create character and webhook.');
        }
    },
};
