const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('@discordjs/builders');
const { ButtonStyle } = require('discord.js');
const { pool } = require('../../util/db');
const { isAdmin } = require('../../util/admins');

module.exports = {
    category: 'voting',
    data: new SlashCommandBuilder()
        .setName('createvote')
        .setDescription('Create a new vote with dynamic options')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Title of the vote')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('content')
                .setDescription('Content or description of the vote')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('options')
                .setDescription('Voting options separated by commas (max 10)')
                .setRequired(true)),
    async execute(interaction) {
        // Check if the user is an administrator
        const member = interaction.member;
        const memberId = member.id;
        const memberPermissions = member.permissions;
        
        if (!await isAdmin(member, memberId, memberPermissions)) {
            return interaction.reply({ content: 'Sorry, you do not have the required permissions to use this command.', ephemeral: true });
        }


        const title = interaction.options.getString('title');
        const content = interaction.options.getString('content');
        let options = interaction.options.getString('options').split(',');

        // Validate each option - ensure it's not empty and trim whitespace
        options = options.map(opt => opt.trim()).filter(opt => opt.length >= 1);

        // Check if there are valid options and not more than 10
        if (options.length === 0 || options.length > 10) {
            return interaction.reply({ content: 'Please provide between 1 and 10 valid voting options.', ephemeral: true });
        }
        try {
            // Create the vote embed with a placeholder message
            const voteEmbed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(content);

            // Send the initial message
            const message = await interaction.reply({ embeds: [voteEmbed], fetchReply: true });

            // Insert the vote into the database
            const insertVoteQuery = 'INSERT INTO votes (message_id, title, content) VALUES ($1, $2, $3) RETURNING vote_id';
            const voteRes = await pool.query(insertVoteQuery, [message.id, title, content]);
            const voteId = voteRes.rows[0].vote_id;

            // Create an array of ActionRowBuilders to hold the voting buttons
            const rows = [];
            let optionIndex = 0;
            for (const option of options) {
                const insertOptionQuery = 'INSERT INTO vote_options (vote_id, option_description) VALUES ($1, $2) RETURNING option_id';
                const optionRes = await pool.query(insertOptionQuery, [voteId, option.trim()]);
                const optionId = optionRes.rows[0].option_id;

                if (optionIndex % 5 === 0) rows.push(new ActionRowBuilder());

                const button = new ButtonBuilder()
                    .setCustomId(`vote_${voteId}_${optionId}`)
                    .setLabel(option.trim())
                    .setStyle(ButtonStyle.Primary);

                rows[rows.length - 1].addComponents(button);
                optionIndex++;
            }

            // Add an "End Vote" button
            const endVoteButton = new ButtonBuilder()
                .setCustomId(`endvote_${voteId}`)
                .setLabel('End Vote')
                .setStyle(ButtonStyle.Danger);

            // Add the "End Vote" button to the last row or create a new row if necessary
            if (options.length % 5 === 0) {
                rows.push(new ActionRowBuilder().addComponents(endVoteButton));
            } else {
                rows[rows.length - 1].addComponents(endVoteButton);
            }

            // Edit the message to include the actual voting buttons
            await interaction.editReply({ embeds: [voteEmbed], components: rows });

        } catch (err) {
            console.error(err);
            await interaction.reply({ content: 'Failed to create the vote.', ephemeral: true });
        }
    },
};