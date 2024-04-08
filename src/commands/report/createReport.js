const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('@discordjs/builders');
const { ButtonStyle } = require('discord.js');
const { pool } = require('../../util/db');
const { chalk, logs, errlogs } = require('../../util/ez_log');
const { incomingReports } = require('../../util/reportCat')

module.exports = {
    category: 'report',
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Create a report')
        .addStringOption(option => 
            option.setName('type')
                .setDescription('The type of report')
                .setRequired(true)
                .addChoices(
                    { name: 'Spam', value: 'spam' },
                    { name: 'Harassment', value: 'harassment' },
                    { name: 'Inappropriate Content', value: 'inappropriate' },
                    { name: 'Bug', value: 'bug' },
                    { name: 'Other', value: 'other' }
                ))
        .addStringOption(option =>
            option.setName('content')
                .setDescription('Content of the report')
                .setRequired(true)),
    async execute(interaction) {
        const type = interaction.options.getString('type');
        const content = interaction.options.getString('content');
        const user = interaction.user.tag;
        const userId = interaction.user.id;
        const guild = interaction.guild;
        const channelID = incomingReports;
        try {
            // Create an embed for the report filter
            const reportEmbed = new EmbedBuilder()
                .setTitle('New Report')
                .setDescription(`Report Type: ${type}\nReported by: ${user}\nContent: ${content}`)
            // Insert embed to the incoming reports channel
            const channel = await guild.channels.fetch(channelID);
            
            // Insert the report into the database
            const query = 'INSERT INTO reports (report_type, user_id, description) VALUES ($1, $2, $3) RETURNING *';
            const values = [type, userId, content];
            const reportRes = await pool.query(query, values);
            const reportId = reportRes.rows[0].report_id;

            // Create the buttons
            const priorityButton = new ButtonBuilder()
                .setCustomId(`priority_${reportId}`)
                .setLabel('Mark as Priority')
                .setStyle(ButtonStyle.Danger);

            const mediumButton = new ButtonBuilder()
                .setCustomId(`medium_${reportId}`)
                .setLabel('Mark as Medium')
                .setStyle(ButtonStyle.Primary);

            const generalButton = new ButtonBuilder()
                .setCustomId(`general_${reportId}`)
                .setLabel('Mark as General')
                .setStyle(ButtonStyle.Secondary);
            
            // Create the action row
            const row = new ActionRowBuilder()
                .addComponents(priorityButton, mediumButton, generalButton);

            // Send the report to the incoming reports channel
            if (channel) {
                await channel.send({ embeds: [reportEmbed], components: [row] });
            } else {
                errlogs(chalk.red('Failed to send report to incoming reports channel at:'), new Date().toISOString().slice(11, 19));
            }

            logs(chalk.magenta(`Report created by user ${user} for ${type} at:`), new Date().toISOString().slice(11, 19));
            await interaction.reply({content: `Report successfully created for ${type}, a moderator will be in touch soon!`, ephemeral: true});
        } catch (err) {
            errlogs(chalk.red('Failed to create report at:'), new Date().toISOString().slice(11, 19));
            errlogs(err);
            await interaction.reply('Failed to create report.');
        }
        
    },
};


