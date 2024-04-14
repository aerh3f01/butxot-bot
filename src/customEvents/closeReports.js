const { EmbedBuilder } = require('discord.js');

// Utils
const customEmitter = require('../util/customEmitter');
const { closedCategory, incomingReportsChannel, logChannel } = require('../util/reportCat');
const { chalk, logs, errlogs } = require('../util/ez_log');
const { pool } = require('../util/db');

customEmitter.on('closeReport', async (interaction, reportNum) => {
    try {

        // Ensure the interaction has a channel context
        const channelName = interaction.channel.name;
        const reportId = channelName.split('-')[1];




        // Fetch the message id from the database
        // incoming_message_id and reports_channel_message_id
        const query = 'SELECT * FROM reports WHERE report_id = $1';
        const values = [reportId];
        const res = await pool.query(query, values);
        const incomingMessageId = res.rows[0].incoming_message_id;
        const reportsChannelMessageId = res.rows[0].reports_channel_message_id;
        const priority = res.rows[0].priority;

        // Fetch the message from the incoming reports channel
        const incomingChannel = await interaction.guild.channels.fetch(incomingReportsChannel);
        const incomingMessage = await incomingChannel.messages.fetch(incomingMessageId);

        // Fetch the message from the reports channel
        const reportsChannel = await interaction.guild.channels.cache.find(channel => channel.name === channelName);
        const reportsChannelMessage = await reportsChannel.messages.fetch(reportsChannelMessageId);


        // Update the message embeds
        const incomingEmbed = incomingMessage.embeds[0];
        const reportsEmbed = reportsChannelMessage.embeds[0];

        // Update the status field
        incomingEmbed.fields[5].value = 'Closed';
        reportsEmbed.fields[3].value = 'Closed';

        // Update the message embeds
        await incomingMessage.edit({ embeds: [incomingEmbed] });
        await reportsChannelMessage.edit({ embeds: [reportsEmbed] });

        // Move channel to a closed category
        await interaction.channel.setParent(closedCategory, { lockPermissions: false })
            .catch(err => {
                errlogs(chalk.red('Failed to move channel to closed category'), err);
                return interaction.channel.send({ content: 'Failed to move channel to closed category', ephemeral: true });
            });

        // Log the event
        let logsChannel = await interaction.guild.channels.fetch(logChannel);
        const logEmbed = new EmbedBuilder()
            .setTitle('Report Closed')
            .setDescription(`Report ${reportId} has been closed by ${interaction.user}`)
            .setColor(0x00AA00)
            .setTimestamp();
        await logsChannel.send({ embeds: [logEmbed] });


        logs(chalk.green('Report event closed successfully'));
    } catch (err) {
        errlogs(chalk.red('Failed to close the report'), err);
    }

});
