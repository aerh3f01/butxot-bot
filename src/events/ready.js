const { Events, ActivityType } = require('discord.js');
const { chalk, logs, tablogs } = require('../util/ez_log');
module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        logs(chalk`{green ${client.user.tag} Ready.}`);
        const guilds = client.guilds.cache;
        const tabData = guilds.map(guild => ({
            name: guild.name,
            id: guild.id,
            memberCount: guild.memberCount,
        }));
        tabData.sort((a,b) => b.memberCount - a.memberCount);
        tablogs(tabData, ['name', 'id', 'memberCount']);
        client.user.setPresence({
            activities: [{name: `poor coders cry`, type: ActivityType.Watching}],
            status: 'dnd',
        });
        module.exports = { client };
        
    },
};