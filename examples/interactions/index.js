// Example on how to use the Interaction Helper
const { Client } = require('wumpcord');

const client = new Client({
  interactions: true,
  token: 'set your token here',
  ws: { intents: ['guildMessages', 'guilds'] }
});

client.on('ready', async () => {
  console.log(`Bot is ready as ${client.user.tag}!`);
  await client.interactions.createGuildCommand('guild id', {
    name: 'beep',
    description: 'It does beep!'
  });
});

client.on('interactionReceive', event => {
  console.log(`Received command /${event.command.name}`);
  return event.message.send('Beep!');
});

client.connect();
