const { SlashCommandBuilder } = require('@discordjs/builders');
const { pool } = require('../../util/db'); // Import your database pool
const isAdmin = require('../../util/admins');

module.exports = {
    category: 'admin',
    data: new SlashCommandBuilder()
        .setName('listhooks')
        .setDescription('Admin only - Lists all webhooks stored in the database'),
    async execute(interaction) {
        // Check if the user is an administrator
        const member = interaction.member;
        const memberId = member.id;
        const memberPermissions = member.permissions;
        const client = interaction.client;
        if (!await isAdmin(member, memberId, memberPermissions)) {
            return interaction.reply({ content: 'Sorry, you do not have the required permissions to use this command.', ephemeral: true });
        }

        // Fetch webhooks from the database
        try {
            const res = await pool.query('SELECT * FROM characters');

            if (res.rows.length === 0) {
                return interaction.reply('No webhooks found.');
            }

            let replyMessage = 'Webhooks found:';
            let characterMessage = '';

            for (const row of res.rows) {
                characterMessage += `\n${row.name} (${row.display_name}) - Creator: ${row.creator_username}`;
            }

            

            await interaction.reply(replyMessage + '\n' + characterMessage);
        } catch (err) {
            console.error(err);
            await interaction.reply('Error fetching webhooks from the database.');
        }
    },
};
