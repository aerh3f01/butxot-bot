const { Events } = require('discord.js');
const { EmbedBuilder } = require('@discordjs/builders');
const { chalk, logs, errlogs } = require('../util/ez_log');
const { logChannel} = require('../util/reportCat');


module.exports = {
    name: Events.MessageDelete,
    async execute(message) {
        if (message.author.bot) return;
        const logsChannel = message.guild.channels.cache.get(logChannel); // Ensure logChannel ID is defined
        const author = message.author;
        const content = message.content || "Err: No content found"; // Handle empty messages
        const channel = message.channel;

        // Ensure the author, content, and channel are converted to string for embed fields
        const logEmbed = new EmbedBuilder()
            .setTitle('Message Deleted')
            .setDescription(`A message was deleted in ${channel}.`)
            .setFields([
                { name: 'Author:', value: author.tag, inline: true }, // Use author.tag for string representation
                { name: 'Content:', value: content.substring(0, 1024), inline: true }, // Ensure content is a string and trimmed to 1024 chars if necessary
                { name: 'Channel:', value: channel.name, inline: true } // Use channel.name for the channel's string name
            ])
            .setColor(0xff0000)
            .setTimestamp();

        // Try to send the embed in the logs channel
        try {
            await logsChannel.send({ embeds: [logEmbed] });
        } catch (err) {
            errlogs(chalk.red("Failed to send message delete log."));
            errlogs(err);
        }
    },
};


