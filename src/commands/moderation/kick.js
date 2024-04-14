const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');

const isAdmin = require('../../util/admins');
const { logChannel } = require('../../util/reportCat');

module.exports = {
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
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if the user has the required permissions
        if (!isAdmin(interaction.member) || !interaction.member.permissions.has([PermissionsBitField.Flags.KickMembers]) ) {
            return interaction.reply({ content: 'You do not have the required permissions to use this command.', ephemeral: true });
        }

        // Check if the bot has the required permissions
        if (!interaction.guild.me.permissions.has([PermissionsBitField.Flags.KickMembers])) {
            return interaction.reply({ content: 'I do not have the required permissions to kick members.', ephemeral: true });
        }

        const logEmbed = new EmbedBuilder() 
            .setTitle('User Kicked')
            .setDescription(`**${user.tag}** has been kicked by **${interaction.user.tag}** for **${reason}**.`)
            .setColor('#ff0000')
            .setTimestamp();

        try {
            await user.kick(reason);

            logChannel.send({ embeds: [logEmbed] })
            return interaction.reply({ content: `Successfully kicked ${user.tag}.`, ephemeral: true });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'There was an error trying to kick that user.', ephemeral: true });
        }
    }
};