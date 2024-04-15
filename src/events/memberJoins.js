const { Events } = require('discord.js');
const { EmbedBuilder } = require('@discordjs/builders');
const { logChannel } = require('../util/reportCat');
const { chalk, logs, errlogs } = require('../util/ez_log');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const logsChannel = member.guild.channels.cache.get(logChannel); // Ensure logChannel ID is defined
        const user = member.user;
        const joinDate = member.joinedAt;
        const creationDate = user.createdAt;

        // Ensure the user, joinDate, and creationDate are converted to string for embed fields
        const logEmbed = new EmbedBuilder()
            .setTitle('Member Joined')
            .setDescription(`**${user.tag}** has joined the server.`)
            .setFields([
                { name: 'User:', value: user.tag, inline: true }, // Use user.tag for string representation
                { name: 'Join Date:', value: joinDate.toDateString(), inline: true }, // Use joinDate.toDateString() for string representation
                { name: 'Creation Date:', value: creationDate.toDateString(), inline: true } // Use creationDate.toDateString() for string representation
            ])
            .setColor(0x0000ff)
            .setTimestamp();

        // Try to send the embed in the logs channel
        try {
            await logsChannel.send({ embeds: [logEmbed] });
            logs(chalk.blue(`Member ${user} has joined the server.`));
        } catch (err) {
            errlogs(chalk.red("Failed to send member join log."));
            errlogs(err);
        }
    },
};