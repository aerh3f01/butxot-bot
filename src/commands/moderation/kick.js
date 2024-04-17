const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');

const isAdmin = require('../../util/admins');
const { logChannel } = require('../../util/reportCat');

const { chalk, logs, errlogs } = require('../../util/ez_log');

module.exports = {
    category: 'moderation',
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the kick.')
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

        const user = interaction.options.getUser('user');
        const logsChannel = await interaction.guild.channels.fetch(logChannel);
        const reason = await interaction.options.getString('reason') || `${interaction.user.tag} provided no reason.`;

        memberToKick = interaction.guild.members.cache.get(user.id);

        const logEmbed = new EmbedBuilder()
            .setTitle('User Kicked')
            .setDescription(`**${user.tag}** has been kicked.`)
            .addFields(
                { name: 'Moderator:', value: interaction.user.tag, inline: true },
                { name: 'Reason', value: reason, inline: true }
            )
            .setColor(0xff0000)
            .setTimestamp();

        try {
            await memberToKick.kick({ reason: reason });

            logsChannel.send({ embeds: [logEmbed] })
            return interaction.reply({ content: `Successfully kicked ${user.tag}.`, ephemeral: true });
        } catch (err) {
            errlogs(chalk.red("Failed to kick user " + user.tag));
            errlogs(err);
            return interaction.reply({ content: 'Failed to kick user.', ephemeral: true });
        }
    }
};