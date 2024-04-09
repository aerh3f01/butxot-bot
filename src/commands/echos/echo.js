const { SlashCommandBuilder, ActionRowBuilder, SelectMenuBuilder } = require('@discordjs/builders');
const { pool } = require('../../util/db.js'); // Import your database pool
const { isAdmin } = require('../../util/admins.js'); // Import your isAdmin function

module.exports = {
    data: new SlashCommandBuilder()
        .setName('echo')
        .setDescription('Character Creator only - Echoes a message using a selected character')
        .addStringOption(option => 
            option.setName('message')
                .setDescription('The message to echo')
                .setRequired(true)),
    async execute(interaction) {
       // Check if the user is an administrator
       const member = interaction.member;
       const memberId = member.id;
       const memberPermissions = member.permissions;
       
       if (!await isAdmin(member, memberId, memberPermissions)) {
           return interaction.reply({ content: 'Sorry, you do not have the required permissions to use this command.', ephemeral: true });
       }
        
        const messageContent = interaction.options.getString('message');

        try {
            // Fetch characters from the database
            const charactersRes = await pool.query('SELECT * FROM characters');
            const characters = charactersRes.rows;

            if (characters.length === 0) {
                return interaction.reply('No characters found.');
            }

            // Create a dropdown menu
            const row = new ActionRowBuilder()
                .addComponents(
                    new SelectMenuBuilder()
                        .setCustomId('select-character')
                        .setPlaceholder('Choose a character')
                        .addOptions(
                            characters.map(character => ({
                                label: character.display_name,
                                value: character.name
                            }))
                        )
                );

            await interaction.reply({ content: 'Select a character:', components: [row], ephemeral: true });
            // Store the message content temporarily
            interaction.client.echoMessages.set(interaction.id, messageContent);
        } catch (err) {
            console.error(err);
            await interaction.reply('Failed to fetch characters.');
        }
    },
};
