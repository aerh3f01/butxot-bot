const { SlashCommandBuilder, ActionRowBuilder, SelectMenuBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const isAdmin = require('../../util/admins');
const { chalk, logs, errlogs } = require('../../util/ez_log');

module.exports = {
    category: 'moderation',
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server.'),
    async execute(interaction) {
        if (!await isAdmin(interaction.member, interaction.member.id, interaction.member.permissions)) {
            return interaction.reply({ content: 'Sorry, you do not have the required permissions to use this command.', ephemeral: true });
        }

        try {
            const bans = await interaction.guild.bans.fetch();
            if (bans.size === 0) {
                return interaction.reply({ content: 'No users are currently banned.', ephemeral: true });
            }

            const banOptions = bans.map(ban => ({
                label: ban.user.tag, // `user` is a property of the `ban` object
                value: ban.user.id
            }));

            const row = new ActionRowBuilder()
                .addComponents(
                    new SelectMenuBuilder()
                        .setCustomId('select-user')
                        .setPlaceholder('Select a user to unban')
                        .addOptions(banOptions)
                );

            await interaction.reply({
                content: 'Select a user to unban:',
                components: [row],
                ephemeral: true
            });

        } catch (err) {
            errlogs(chalk.red("Failed to unban user."));
            errlogs(err);
            await interaction.reply({ content: 'An error occurred while trying to unban the user.', ephemeral: true });
        }
    }
};
