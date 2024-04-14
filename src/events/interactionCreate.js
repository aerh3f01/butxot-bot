const { Events, ChannelType, PermissionsBitField } = require('discord.js');
const { pool } = require('../util/db'); 
const { WebhookClient } = require('discord.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('@discordjs/builders');
const { chalk, logs, errlogs } = require('../util/ez_log');
const { priorityCategory, mediumCategory, generalCategory } = require('../util/reportCat');
const customEmitter = require('../util/customEmitter');


module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handle custom command interactions for closeReport
        if (interaction.isCommand() && interaction.commandName === 'close-report') {
            await customEmitter.emit('closeReport', interaction);
        }
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
                    errlogs(chalk.red('Failed to send the message at:'), new Date().toISOString().slice(11, 19));
                    errlogs(chalk.red(err));
                    await interaction.update({ content: 'Failed to send the message.', components: [] });
                }
            }
        }
        if (interaction.isButton()) {
            // Handle the buttons between voting and report commands
            const [action, interactId, optionId = '0'] = interaction.customId.split('_');


            try {
                if (action === 'vote') {
                    // Implement vote logic
                    // Check if the user has already voted
                    const userVoteCheckQuery = 'SELECT 1 FROM user_votes WHERE user_id = $1 AND vote_id = $2';
                    const userVoteCheck = await pool.query(userVoteCheckQuery, [interaction.user.id, interactId]);

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
                    await pool.query(recordUserVoteQuery, [interaction.user.id, interactId, optionId]);

                    await interaction.reply({ content: 'Your vote has been recorded!', ephemeral: true });

                } else if (action === 'endvote') {
                    try {
                        // Fetch final vote counts
                        const finalCountQuery = 'SELECT option_description, vote_count FROM vote_options WHERE vote_id = $1';
                        const finalCounts = await pool.query(finalCountQuery, [interactId]);

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
                        errlogs(chalk.red('Failed to end the vote at:'), new Date().toISOString().slice(11, 19));
                        errlogs(chalk.red(err));
                        await interaction.reply({ content: 'An error occurred while ending the vote.', ephemeral: true });
                    }
                } else if (action === 'priority' || action === 'medium' || action === 'general') {
                    // Implement report priority logic
                    const priorityLevel = action === 'priority' ? 'Priority' : action === 'medium' ? 'Medium' : 'General';

                    // Update the report with the priority level
                    const updateReportQuery = 'UPDATE reports SET report_priority = $1 WHERE report_id = $2';
                    await pool.query(updateReportQuery, [priorityLevel, interactId]);

                    // Update the report status to In Progress
                    const updateStatusQuery = 'UPDATE reports SET status = $1 WHERE report_id = $2';
                    await pool.query(updateStatusQuery, ['In Progress', interactId]);

                    // Get the original user from the database
                    const userQuery = 'SELECT user_id FROM reports WHERE report_id = $1';
                    const userRes = await pool.query(userQuery, [interactId]);
                    const reportCreator = await interaction.guild.members.fetch(userRes.rows[0].user_id);

                    // Get the report type from the database
                    const reportTypeQuery = 'SELECT report_type FROM reports WHERE report_id = $1';
                    const reportTypeRes = await pool.query(reportTypeQuery, [interactId]);
                    const reportType = reportTypeRes.rows[0].report_type;

                    // For the type of action, change the required category
                    const category = priorityLevel === 'Priority' ? priorityCategory : priorityLevel === 'Medium' ? mediumCategory : generalCategory;
                    try {
                        // Create a new channel for the report in the defined category
                        const report_channel = await interaction.guild.channels.create({
                            name: `report-${interactId}`,
                            type: ChannelType.GuildText,
                            permissionOverwrites: [
                                {
                                    id: interaction.guild.id,
                                    deny: [PermissionsBitField.Flags.ViewChannel],
                                },
                                {
                                    id: reportCreator.id,
                                    allow: [PermissionsBitField.Flags.ViewChannel],
                                },
                            ],
                            parent: category
                        })
                        
                        // Editing permissions to allow moderators to view the channel
                        const moderatorRole = interaction.guild.roles.cache.find(role => role.name === 'Moderator');
                        if (moderatorRole) {
                            await report_channel.permissionOverwrites.edit(moderatorRole, {
                                ViewChannel: true
                            });
                        }
                       
                        // Send the report embed to the new channel
                        const reportStatusEmbed = new EmbedBuilder()
                            .setTitle(`Report #${interactId}`)
                            .setDescription(`A new report has been created for ${reportType}`)
                            .setFields([
                                { name: 'Report ID', value: interactId.toString(), inline: true },
                                { name: 'Report Type', value: reportType.toString(), inline: true },
                                { name: 'Reported By', value: reportCreator.toString(), inline: true },
                                { name: 'Status', value: 'In Progress', inline: true },
                                { name: 'Priority', value: priorityLevel.toString(), inline: true }
                            ])
                            .setFooter({ text: 'Report created at:' + new Date().toISOString().slice(11, 19)});

                            

                        // Send the embed to the new channel
                        const report_channel_message = await report_channel.send({ embeds: [reportStatusEmbed] });
                        
                        // Update the database with the message id
                        const updateMessageQuery = 'UPDATE reports SET reports_channel_message_id = $1 WHERE report_id = $2';
                        await pool.query(updateMessageQuery, [report_channel_message.id, interactId]);

                        // Send a message to start the conversation
                        await report_channel.send(`Hello, ${reportCreator}! A moderator will be with you shortly to discuss your report.`);

                        logs(chalk.magenta(`New channel ${report_channel.name} created at: `), new Date().toISOString().slice(11, 19));
                        logs(chalk.magenta(`Report #${interactId} has been marked as ${priorityLevel} at:`), new Date().toISOString().slice(11, 19));
                    } catch (err) {
                        errlogs(chalk.red('Failed to create a new channel for the report at:'), new Date().toISOString().slice(11, 19));
                        errlogs(chalk.red(err));
                    }

                    // Acknowledge the interaction
                    await interaction.reply({ content: `The report has been marked as ${priorityLevel}.`, ephemeral: true });

                    // Fetch the original message
                    const originalMessage = await interaction.message.fetch();

                    // Edit fields to include the priority level
                    const reportEmbed = originalMessage.embeds[0]; 
                    reportEmbed.fields[5].value = 'In Progress';
                    reportEmbed.fields[6].value = priorityLevel;
                    await originalMessage.edit({ embeds: [reportEmbed] });


                    // Disable all buttons
                    const updatedComponents = originalMessage.components.map(row =>
                        new ActionRowBuilder().addComponents(
                            row.components.map(component =>
                                new ButtonBuilder(component.toJSON()).setDisabled(true)
                            )
                        )
                    );

                    // Update the original message with the disabled buttons
                    await originalMessage.edit({ components: updatedComponents });


                }
            } catch (err) {
                errlogs(chalk.red('Failed to process the interaction at:'), new Date().toISOString().slice(11, 19));
                errlogs(chalk.red(err));
                await interaction.reply({ content: 'An error occurred while processing your interaction.', ephemeral: true });
            }
        };
    }
};