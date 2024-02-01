const { SlashCommandBuilder } = require('@discordjs/builders');
const { pool } = require('../../util/db'); // Import your database pool

module.exports = {
    category: 'admin',
    data: new SlashCommandBuilder()
        .setName('listhooks')
        .setDescription('Lists all webhooks stored in the database'),
    async execute(interaction) {
        // Fetch webhooks from the database
        try {
            const res = await pool.query('SELECT * FROM characters');

            if (res.rows.length === 0) {
                return interaction.reply('No webhooks found.');
            }

            let replyMessage = 'Webhooks found:';
            let characterMessage = '';

            for (const row of res.rows) {
                characterMessage += `\n${row.name} (${row.display_name}) - ${row.webhook_url}`;
            }

            

            await interaction.reply(replyMessage + '\n' + characterMessage);
        } catch (err) {
            console.error(err);
            await interaction.reply('Error fetching webhooks from the database.');
        }
    },
};
