// Simple ping bot made in Wumpcord!

const { Client } = require('wumpcord');
const client = new Client({
  ws: { intents: ['guilds', 'guildMessages'] },
  token: 'set your token here'
});

client.on('ready', () => console.info(`Bot is ready as ${client.user.tag}!`));
client.on('message', event => {
  if (event.message.content === '!ping')
    return event.channel.send('Pong!');
});

client.connect();
