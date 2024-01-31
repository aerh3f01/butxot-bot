const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	category: 'utility',
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with the ping.'),
	async execute(interaction) {
		await interaction.reply(`Ping: ${Math.round(interaction.client.ws.ping)} ms`);
	},
};