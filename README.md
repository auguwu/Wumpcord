# Wumpcord
> :rowboat: **Flexible, type-safe, and lightweight Discord API library made in TypeScript**

## Features
- Clustering Support: Tired of build your own [clustering](https://nodejs.org/api/cluster.html) library to your bot? Wumpcord has clustering support built-in with a modular system to plug-in-play methods with IPC and Redis Pub/Sub support.
- Extra Utilities: Wumpcord bundles in with extra utilities like a Reaction Handler and a Message Collector.

## Installation
You can install **Wumpcord** under NPM, as follows:

```sh
$ npm i --no-optional wumpcord
```

### Features
Specific features require extra dependencies, this is a list that requires them

#### Voice Dependencies
> If `@discordjs/opus` or `opusscript` isn't installed, the library will error out and you will not have access to Voice

- `tweetnacl`
  - Required: Yes
  - Native: No

- `@discordjs/opus`
  - Required: No
  - Alternative: **opusscript**
  - Native: Yes

- `opusscript`
  - Required: No
  - Alternative: **@discordjs/opus**
  - Native: Yes

- `ogg`
  - Required: No
  - Native: Yes
  - For: OGG decoding

#### Cluster Dependencies
- `ioredis`
  - Required: No
  - Native: No
  - Alternative: IPC (no dependencies)

## Need Support?
You can join the server below and join in #support under the **Wumpcord** category

[![discord embed owo](https://discord.com/api/v8/guilds/382725233695522816/widget.png?style=banner3)](https://discord.gg/JjHGR6vhcG)

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

## Special Thanks To
- [Ice](https://github.com/IceeMC) for writing the voice library <3

## Maintainers
- [August](https://floofy.dev)
- [Ice](https://github.com/IceeMC)

## Testers
None at the moment.

## License
**Wumpcord** is released under the [MIT](/LICENSE) License. <3
