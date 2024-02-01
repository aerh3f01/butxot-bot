const { Events } = require('discord.js');
const { pool } = require('../util/db'); // Import your database pool
const { WebhookClient } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handling Chat Input Commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        }

        // Handling Select Menu Interactions
        else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'select-character') {
                const characterName = interaction.values[0];
                const messageContent = interaction.client.echoMessages.get(interaction.message.interaction.id);

                try {
                    const characterQuery = 'SELECT * FROM characters WHERE name = $1';
                    const characterRes = await pool.query(characterQuery, [characterName]);

                    if (characterRes.rows.length === 0) {
                        return interaction.update({ content: 'Character not found.', components: [] });
                    }

                    const character = characterRes.rows[0];
                    const webhookClient = new WebhookClient({ url: character.webhook });

                    await webhookClient.send({
                        content: messageContent,
                        username: character.display_name,
                        avatarURL: character.avatar_url
                    });

                    await interaction.update({ content: 'Message sent!', components: [] });
                } catch (err) {
                    console.error(err);
                    await interaction.update({ content: 'Failed to send the message.', components: [] });
                }
            }
        }
    },
};
