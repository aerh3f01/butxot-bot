const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

const isAdmin = require('../../util/admins');
const { logChannel } = require('../../util/reportCat');

const { chalk, logs, errlogs } = require('../../util/ez_log');

module.exports = {
    category: 'moderation',
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user from the server.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to timeout.')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('The duration of the timeout in minutes.')
                .setRequired(true)
                .addChoices(
                    { name: 'Remove Timeout', value: 0 },
                    { name: '5 minutes', value: 5 },
                    { name: '10 minutes', value: 10 },
                    { name: '1 hour', value: 60 },
                    { name: '1 day', value: 1440 },
                    { name: '1 week', value: 10080 }
                )
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the timeout.')
                .setRequired(false)
        ),
    async execute(interaction) {
        // Check if the user is an administrator
        const member = interaction.member;
        const memberId = member.id;
        const memberPermissions = member.permissions;

        if (!await isAdmin(member, memberId, memberPermissions)) {
            return interaction.reply({ content: 'Sorry, you do not have the required permissions to use this command.', ephemeral: true });
        }

        const user = await interaction.options.getUser('user');
        const reason = await interaction.options.getString('reason') || 'No reason provided';
        const duration = await interaction.options.getInteger('duration');
        const durationName = duration === 0 ? 'Remove Timeout' : duration === 5 ? '5 minutes' : duration === 10 ? '10 minutes' : duration === 60 ? '1 hour' : duration === 1440 ? '1 day' : '1 week';

        // Timeout lengths of 5 mins, 10 mins, 1 hour, 1 day, 1 week converted to milliseconds
        let timeoutLength;
        switch (duration) {
            case 0:
                timeoutLength = null;
                break;
            case 5:
                timeoutLength = 300000;
                break;
            case 10:
                timeoutLength = 600000;
                break;
            case 60:
                timeoutLength = 3600000;
                break;
            case 1440:
                timeoutLength = 86400000;
                break;
            case 10080:
                timeoutLength = 604800000;
                break;
            default:
                return interaction.reply({ content: 'Invalid timeout duration. Please use 5, 10, 60, 1440, or 10080 minutes.', ephemeral: true });
        }

        // Set embed color based on timeout length
        const embedColour = timeoutLength === null ? 0x00FF00 : 0xFF0000;

       
        
        const logEmbed = new EmbedBuilder()
            .setTitle('User Timed Out')
            .setDescription(`**${user.tag}** has been timed out.`)
            .addFields(
                { name: 'Moderator:', value: interaction.user.tag, inline: true},
                { name: 'Duration', value: durationName, inline: true },
                { name: 'Reason', value: reason, inline: true }
            )
            .setColor(embedColour)
            .setTimestamp();

        const logsChannel = await interaction.guild.channels.fetch(logChannel);

        const guildMember = await interaction.guild.members.fetch(user.id);

        try {
            await guildMember.timeout(timeoutLength, reason);

            logsChannel.send({ embeds: [logEmbed] })
            return interaction.reply({ content: `Successfully timed out ${user.tag}.`, ephemeral: true });
        } catch (error) {
            errlogs(chalk.red("Failed to timeout user " + user.tag));
            errlogs(chalk.red(error));
            return interaction.reply({ content: 'There was an error trying to timeout that user.', ephemeral: true });
        }
    }
};