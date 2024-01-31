const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Help for the bot commands.'),
        async execute(message) {
            let commands = Array.from(message.client.commands.values());
            
            let helpEmbed = new EmbedBuilder()
                .setTitle("Bot Helper")
                .setDescription(`Get help using ${message.client.user.username}!`)
                .setColor("#F8AA2A");
    
            commands.forEach((cmdObj) => {
                const cmdData = cmdObj.data;
                helpEmbed.addFields(
                    {
                        name: `**/${cmdData.name}**`,
                        value: cmdData.description,
                        inline: true
                    }
                );
            });
    
            helpEmbed.setTimestamp();
    
            try {
                await message.channel.send({ embeds: [helpEmbed] });
            } catch (error) {
                console.error(error);
            }
        },
    };