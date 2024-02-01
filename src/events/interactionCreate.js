const { Events } = require('discord.js');
const { pool } = require('../util/db'); // Import your database pool
const { WebhookClient } = require('discord.js');
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('@discordjs/builders');

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
        if (interaction.isButton()) {
            const [action, voteId, optionId] = interaction.customId.split('_');

            try {
                if (action === 'vote') {
                    // Implement vote logic
                    // Check if the user has already voted
                    const userVoteCheckQuery = 'SELECT 1 FROM user_votes WHERE user_id = $1 AND vote_id = $2';
                    const userVoteCheck = await pool.query(userVoteCheckQuery, [interaction.user.id, voteId]);

                    if (userVoteCheck.rowCount > 0) {
                        // User has already voted
                        await interaction.reply({ content: 'You have already voted!', ephemeral: true });
                        return;
                    }

                    // Update the vote count
                    const updateVoteQuery = 'UPDATE vote_options SET vote_count = vote_count + 1 WHERE option_id = $1';
                    await pool.query(updateVoteQuery, [optionId]);

                    // Record the user's vote
                    const recordUserVoteQuery = 'INSERT INTO user_votes (user_id, vote_id, option_id) VALUES ($1, $2, $3)';
                    await pool.query(recordUserVoteQuery, [interaction.user.id, voteId, optionId]);

                    await interaction.reply({ content: 'Your vote has been recorded!', ephemeral: true });

                } else if (action === 'endvote') {
                    try {
                        // Fetch final vote counts
                        const finalCountQuery = 'SELECT option_description, vote_count FROM vote_options WHERE vote_id = $1';
                        const finalCounts = await pool.query(finalCountQuery, [voteId]);

                        // Construct a new embed with the final results
                        let resultsDescription = 'Voting has ended. Here are the final results:\n\n';
                        finalCounts.rows.forEach(row => {
                            resultsDescription += `${row.option_description}: ${row.vote_count} votes\n`;
                        });

                        // Create an updated embed
                        const updatedEmbed = new EmbedBuilder()
                            .setTitle('Voting Results')
                            .setDescription(resultsDescription)
                            .setColor(0x00AE86); // You can change the color if needed

                        // Fetch the original message
                        const originalMessage = await interaction.message.fetch();

                        // Disable all buttons
                        const updatedComponents = originalMessage.components.map(row =>
                            new ActionRowBuilder().addComponents(
                                row.components.map(component =>
                                    new ButtonBuilder(component.toJSON()).setDisabled(true)
                                )
                            )
                        );

                        // Update the original message with the new embed and disabled buttons
                        await originalMessage.edit({ embeds: [updatedEmbed], components: updatedComponents });

                        // Acknowledge the interaction
                        await interaction.reply({ content: 'The vote has been ended and results are updated.', ephemeral: true });
                    } catch (err) {
                        console.error(err);
                        await interaction.reply({ content: 'An error occurred while processing your vote.', ephemeral: true });
                    }
                }
            } catch (err) {
                console.error(err);
                await interaction.reply({ content: 'An error occurred while processing your vote.', ephemeral: true });
            }
        };
    }
};