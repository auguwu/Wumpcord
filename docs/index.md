# Wumpcord
Flexible, type-safe, and lightweight Discord API library made in TypeScript.

## Features
- Command Handling: Tired of using a command handler to add extra dependencies? Wumpcord has that built-in, similar API to discord.js-commando.
- Clustering Support: Tired of adding [clustering](https://nodejs.org/api/cluster.html) to your bot? Wumpcord has clustering support built-in.
- Extra Utilities: Wumpcord bundles in with extra utilities like a Reaction Handler and a Message Collector.

## Example Bot
```js
const { Client } = require('wumpcord');
const client = new Client({
  token: '',
  ws: { intents: ['guilds', 'guildMessages'] }
});

client.on('message', event => {
  if (event.message.content === '!ping') return event.message.channel.send('henlo world');
});

client.on('ready', async () => {
  console.log(`Connected as ${client.user.tag}!`);
  client.setStatus('online', { // Sets it to "Competing in uwu"
    type: 5,
    name: 'uwu'
  });
});


client.connect();
```

## Maintainers
- [August](https://floofy.dev)
- [Ice](https://github.com/IceeMC)

## Testers
None at the moment.

## License
Wumpcord is released under the [MIT](https://github.com/auguwu/Wumpcord/tree/master/LICENSE) License. <3
