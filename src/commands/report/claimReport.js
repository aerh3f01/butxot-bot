const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('@discordjs/builders');
const { ButtonStyle } = require('discord.js');
const { pool } = require('../../util/db');
const { chalk, logs, errlogs } = require('../../util/ez_log');
const  isAdmin  = require('../../util/admins');

module.exports = {
    category: 'report',
    data: new SlashCommandBuilder()
        .setName('claim')
        .setDescription('Claim a report'),

    async execute(interaction) {

        // Check if the user is an administrator
        const member = interaction.member;
        const memberId = member.id;
        const memberPermissions = member.permissions;

        if (!await isAdmin(member, memberId, memberPermissions)) {
            return interaction.reply({ content: 'Sorry, you do not have the required permissions to use this command.', ephemeral: true });
        }

        // Get the report ID from the channel name
        const channelName = interaction.channel.name;
        const reportId = channelName.split('-')[1];

        // Check that the channel isnt already claimed
        const queryCheck = 'SELECT * FROM reports WHERE report_id = $1';
        const valuesCheck = [reportId];
        try {
            const resCheck = await pool.query(queryCheck, valuesCheck);
            if (resCheck.rows[0].claim_id) {
                return interaction.reply({ content: 'This report has already been claimed.', ephemeral: true });
            }
        }
        catch (err) {
            errlogs(chalk.red('Failed to check if report is already claimed'), err);
            return interaction.reply({ content: 'Failed to check if report is already claimed', ephemeral: true });
        }

        // Update the report claim in the database
        const query = 'UPDATE reports SET claim_id = $1 WHERE report_id = $2 RETURNING *';
        const values = [memberId, reportId];
        try {
            const res = await pool.query(query, values);
            logs(chalk.blue(`Report ${reportId} claimed by ${member.user.tag}`));
            interaction.channel.send(`Report ${reportId} claimed by ${member.user.tag}`);
            await interaction.reply({ content:`Report ${reportId} claimed by ${member.user.tag}`, ephemeral: true });
        }
        catch (err) {
            errlogs(chalk.red('Failed to claim report'), err);
            await interaction.reply({ content: 'Failed to claim report', ephemeral: true });
        }

    }
};




