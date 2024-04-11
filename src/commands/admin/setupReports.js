const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const { chalk, logs, errlogs } = require('../../util/ez_log');
const isAdmin = require('../../util/admins');

const fs = require('fs');
const path = require('path');
const { ChannelType } = require('discord.js');
const configPath = path.join(__dirname, '../../config.json');
const config = require(configPath);

// Command to set up reports/mod category if not already set up

module.exports = {
    category: 'admin',
    data: new SlashCommandBuilder()
        .setName('setupreports')
        .setDescription('Admin only - Sets up the reports/mod category if not already set created'),
    async execute(interaction) {
        // Check if the user is an administrator
        const member = interaction.member;
        const memberId = member.id;
        const memberPermissions = member.permissions;
        
        if (!await isAdmin(member, memberId, memberPermissions)) {
            return interaction.reply({ content: 'Sorry, you do not have the required permissions to use this command.', ephemeral: true });
        }

        // Check if moderation category already exists
        const guild = interaction.guild;
        const categories = await guild.channels.cache.filter(channel => channel.type === ChannelType.GuildCategory).map(category => category);
        let modCategory = categories.find(category => category.name === 'moderation');
        
        let priorityCategory = categories.find(category => category.name === 'priority reports');
        
        let mediumCategory = categories.find(category => category.name === 'medium reports');
        
        let generalCategory = categories.find(category => category.name === 'general reports');

        let modRoleId = guild.roles.cache.find(role => role.name === 'Moderator');
        let adminRoleId = guild.roles.cache.find(role => role.name === 'Admin');

        if (!modCategory) {
            try {
                modCategory = await guild.channels.create({ 
                    name: 'moderation',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        // Deny everyone access to the category
                        {
                            id: guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                        // Allow moderators to view the category
                        {
                            id: modRoleId,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                        },
                        // Allow admins to view the category
                        {
                            id: adminRoleId,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                        },
                    ],
                });
                logs(chalk.blue('Moderation category created'));
                // Create the incomming reports channel
                const incomingReportsChannel = await guild.channels.create({
                    name: 'incoming-reports',
                    type: ChannelType.GuildText,
                    parent: modCategory.id,
                });

                // Add the channel id to the config file
                config.incomingReportsChannel = incomingReportsChannel.id;
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));


                logs(chalk.blue('Incoming reports channel created'));
            } catch (err) {
                errlogs(chalk.red('Failed to create moderation category'), err);
                return interaction.reply({ content: 'Failed to create moderation category', ephemeral: true });
            }
        }

        if (!priorityCategory) {
            try {
                priorityCategory = await guild.channels.create({
                    name: 'priority reports',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        // Deny everyone access to the category
                        {
                            id: guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                        // Allow moderators to view the category
                        {
                            id: modRoleId,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                        },
                        // Allow admins to view the category
                        {
                            id: adminRoleId,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                        },
                    ],
                });
                logs(chalk.blue('Priority reports category created'));
            } catch (err) {
                errlogs(chalk.red('Failed to create priority reports category'), err);
                return interaction.reply({ content: 'Failed to create priority reports category', ephemeral: true });
            }
        }

        if (!mediumCategory) {
            try {
                mediumCategory = await guild.channels.create({
                    name: 'medium reports',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        // Deny everyone access to the category
                        {
                            id: guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                        // Allow moderators to view the category
                        {
                            id: modRoleId,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                        },
                        // Allow admins to view the category
                        {
                            id: adminRoleId,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                        },
                    ],
                });
                logs(chalk.blue('Medium reports category created'));
            } catch (err) {
                errlogs(chalk.red('Failed to create medium reports category'), err);
                return interaction.reply({ content: 'Failed to create medium reports category', ephemeral: true });
            }
        }

        if (!generalCategory) {
            try {
                generalCategory = await guild.channels.create({
                    name: 'general reports',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        // Deny everyone access to the category
                        {
                            id: guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                        // Allow moderators to view the category
                        {
                            id: modRoleId,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                        },
                        // Allow admins to view the category
                        {
                            id: adminRoleId,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                        },
                    ],
                });
                logs(chalk.blue('General reports category created'));
            } catch (err) {
                errlogs(chalk.red('Failed to create general reports category'), err);
                return interaction.reply({ content: 'Failed to create general reports category', ephemeral: true });
            }
        }

        // Add the category and channel ids to the config file
        config.modCategory = modCategory.id;
        config.priorityCategory = priorityCategory.id;
        config.mediumCategory = mediumCategory.id;
        config.generalCategory = generalCategory.id;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        logs(chalk.blue('Config file updated'));

        await interaction.reply({ content: 'Reports and mod category set up successfully!', ephemeral: true });
    }
};

