const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

const isAdmin = require('../../util/admins');
const { logChannel } = require('../../util/reportCat');

const { chalk, logs, errlogs } = require('../../util/ez_log');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Get the bot invite link.'),
    async execute(interaction) {
        // Check if the user is an administrator
        const member = interaction.member;
        const memberId = member.id;
        const memberPermissions = member.permissions;

        if (!await isAdmin(member, memberId, memberPermissions)) {
            return interaction.reply({ content: 'Sorry, you do not have the required permissions to use this command.', ephemeral: true });
        }

        const inviteLink = `https://discord.com/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot%20applications.commands`;

        const user = interaction.user;
        const logsChannel = interaction.guild.channels.cache.get(logChannel);

        const logEmbed = new EmbedBuilder()
            .setTitle('Invite Link Generated')
            .setDescription(`Invite link generated for **${user.tag}**.`)
            
            .setColor(0xf0f0aa)
            .setTimestamp();

        // Check is the user can receive DMs
        if (!user.dmChannel) {
            try {
                await user.createDM();
            } catch (err) {
                errlogs(chalk.red("Failed to create DM channel with " + user.tag));
                errlogs(err);
                return interaction.reply({ content: 'I cant direct message you to send the invite link! Please allow me to message you!', ephemeral: true });
            }
        }

        try {
            // Dm user the invite link
            await user.send(`Invite link: ${inviteLink}`);
            await interaction.reply({ content: `Invite link sent in DMs.`, ephemeral: true });
            logs(chalk.green(`Invite link sent to ${user.tag}.`));
            await logsChannel.send({ embeds: [logEmbed] });
        }
        catch (err) {
            errlogs(chalk.red("Failed to send invite link to " + user.tag));
            errlogs(err);
        }
    }
};