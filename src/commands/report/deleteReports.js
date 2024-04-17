const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const isAdmin = require('../../util/admins');
const { logChannel, closedCategory } = require('../../util/reportCat');
const { chalk, logs, errlogs } = require('../../util/ez_log');

module.exports = {
    category: 'report',
    data: new SlashCommandBuilder()
        .setName('delete-reports')
        .setDescription('Delete all reports in the closed category.'),
    async execute(interaction) {
        // Check if the user is an administrator
        if (!await isAdmin(interaction.member, interaction.member.id, interaction.member.permissions)) {
            return interaction.reply({ content: 'Sorry, you do not have the required permissions to use this command.', ephemeral: true });
        }

        try {
            // Fetch the category and logs channel
            const logsChannel = await interaction.guild.channels.fetch(logChannel);
            const category = await interaction.guild.channels.fetch(closedCategory);
            
            if (!category || category.type !== 4) {
                console.log(category);
                return interaction.reply({ content: 'Category not found or is not a valid category.', ephemeral: true });
            }

            // Delete all channels within the category
            const channels = category.children.cache;
            let numChannels = 0;
            for (const [channelId, channel] of channels) {
                await channel.delete();
                logs(chalk.green(`Deleted channel ${channelId}.`));
                numChannels++;
            }

            const logEmbed = new EmbedBuilder()
                .setTitle('Reports Deleted')
                .setDescription(`${numChannels} reports have been deleted.`)
                .setColor(0xf0f0aa)
                .setTimestamp();

            await interaction.reply({ content: `${numChannels} report channels deleted.`, ephemeral: true });
            await logsChannel.send({ embeds: [logEmbed] });

        } catch (err) {
            errlogs(chalk.red("Failed to perform deletion or log operation."));
            errlogs(err);
            await interaction.reply({ content: 'An error occurred while trying to delete reports.', ephemeral: true });
        }
    }
};
