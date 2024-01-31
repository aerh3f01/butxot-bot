const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ComponentType } = require('discord.js');

module.exports = {
    category: 'voting',
    data: new SlashCommandBuilder()
        .setName('vote')
        .setDescription('Create a voting poll')
        .addStringOption(option =>
            option.setName('items')
                .setDescription('Enter items to vote on, separated by commas')
                .setRequired(true)),

    async execute(interaction) {
        const items = interaction.options.getString('items').split(',');
        const emojis = ['👍', '👎']; // Add more emojis based on your needs
        let votes = new Array(items.length).fill(0);

        const voteEmbed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('Voting Poll')
            .setDescription('React to vote on your favorite item!')
            .setTimestamp();

        items.forEach((item, index) => {
            voteEmbed.addFields({ name: `Option ${index + 1}`, value: `${item} - Votes: 0`, inline: true });
        });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('endVote')
                .setLabel('End Vote')
                .setStyle('Danger')
        );

        const message = await interaction.reply({ embeds: [voteEmbed], components: [row], fetchReply: true });

        items.forEach((_, index) => {
            if (index < emojis.length) {
                message.react(emojis[index]);
            }
        });


        const collectorFilter = (reaction, user) => {
            return ['👍', '👎'].includes(reaction.emoji.name) && user.id === interaction.user.id;
        };

        message.awaitReactions({ filter: collectorFilter, max: 1, time: 60_000, errors: ['time'] })
            .then(collected => {
                const reaction = collected.first();

                if (reaction.emoji.name === '👍') {
                    message.reply('You reacted with a thumbs up.');
                } else {
                    message.reply('You reacted with a thumbs down.');
                }
            })
            .catch(collected => {
                message.reply('You reacted with neither a thumbs up, nor a thumbs down.');
            });



    },
};
