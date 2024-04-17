const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');

const isAdmin = require('../../util/admins');
const { logChannel } = require('../../util/reportCat');

const { chalk, logs, errlogs } = require('../../util/ez_log');

module.exports = {
    category: 'moderation',
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the ban.')
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

        const logsChannel = await interaction.guild.channels.fetch(logChannel);

        const user = await interaction.options.getUser('user');
        const reason = await interaction.options.getString('reason') || `${interaction.user.tag} provided no reason.`;

        const memberToBan = interaction.guild.members.cache.get(user.id);

        if (!memberToBan) {
            return interaction.reply({ content: 'User not found in this guild.', ephemeral: true });
        }
        // Checking if the member has the Administrator permission
        if (memberToBan.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'Sorry, you cannot ban an administrator.', ephemeral: true });
        }

        const logEmbed = new EmbedBuilder()
            .setTitle('User Banned')
            .setDescription(`**${user.tag}** has been banned.`)
            .addFields(
                { name: 'Moderator:', value: interaction.user.tag, inline: true },
                { name: 'Reason', value: reason, inline: true }
            )
            .setColor(0xff0000)
            .setTimestamp();

        try {
            await memberToBan.ban({ reason: reason });
            logsChannel.send({ embeds: [logEmbed] })
            return interaction.reply({ content: `Successfully banned ${user.tag}.`, ephemeral: true });
        }
        catch (err) {
            errlogs(chalk.red("Failed to ban user " + user.tag));
            errlogs(chalk.red(err));
            return interaction.reply({ content: 'There was an error trying to ban that user.', ephemeral: true });
        }
    },
};