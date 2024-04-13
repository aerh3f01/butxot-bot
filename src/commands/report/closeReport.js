const { SlashCommandBuilder } = require('@discordjs/builders');
const { ButtonBuilder, ActionRowBuilder } = require('discord.js');
const { ButtonStyle } = require('discord.js');

// DB
const { pool } = require('../../util/db');

// Utils
const customEmitter = require('../../util/customEmitter');
const { chalk, logs, errlogs } = require('../../util/ez_log');
const isAdmin = require('../../util/admins');

module.exports = {
    category: 'report',
    data: new SlashCommandBuilder()
        .setName('close-report')
        .setDescription('Close a report')
        .addIntegerOption(option =>
            option.setName('report_id')
                .setDescription('The ID of the report to close')
                .setRequired(false)),
    async execute(interaction) {
        const member = interaction.member;
        const memberId = member.id;
        const memberPermissions = member.permissions;

        if (!isAdmin(member, memberId, memberPermissions)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const reportId = interaction.options.getInteger('report_id');

        // If no report ID is provided, close the report in the current channel
        if (!reportId) {
            const channelName = interaction.channel.name;
            const reportId = channelName.split('-')[1];

            const queryCheck = 'SELECT * FROM reports WHERE report_id = $1';
            const valuesCheck = [reportId];
            try {
                const resCheck = await pool.query(queryCheck, valuesCheck);
                if (resCheck.rows[0].status === 'Closed') {
                    return interaction.reply({ content: `Report #${reportId} is already closed.`, ephemeral: true });
                }
            }
            catch (err) {
                errlogs(chalk.red('Failed to check if report is already closed'), err);
                return interaction.reply({ content: 'Failed to check if report is already closed', ephemeral: true });
            }

            const updateQuery = 'UPDATE reports SET status = $1 WHERE report_id = $2 RETURNING *';
            const updateValues = ['Closed', reportId];
            await pool.query(updateQuery, updateValues);

            // Use the custom emitter to emit a closeReport event
            customEmitter.emit('closeReport', interaction, reportId);

            return interaction.reply({ content: `Report #${reportId} has been closed.`, ephemeral: true });

        }

        const query = 'SELECT * FROM reports WHERE report_id = $1';
        const values = [reportId];
        const reportRes = await pool.query(query, values);
        if (reportRes.rowCount === 0) {
            return interaction.reply({ content: `Report #${reportId} does not exist.`, ephemeral: true });
        }

        const report = reportRes.rows[0];
        if (report.status === 'Closed') {
            return interaction.reply({ content: `Report #${reportId} is already closed.`, ephemeral: true });
        }

        const updateQuery = 'UPDATE reports SET status = $1 WHERE report_id = $2 RETURNING *';
        const updateValues = ['Closed', reportId];
        await pool.query(updateQuery, updateValues);

        // Use the custom emitter to emit a closeReport event
        customEmitter.emit('closeReport', interaction, reportId);

        interaction.reply({ content: `Report #${reportId} has been closed.`, ephemeral: true });
    }
};