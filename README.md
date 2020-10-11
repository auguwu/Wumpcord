# Wumpcord
> :rowboat: **| Flexible, type-safe, and lightweight Discord API library**

## Features
- Not cached by default
  - Everything is not cached by default (guilds, users, etc), you'll have to enable it with the stuff you want cached.
- Clustering
  - You can opt to using the Clustering API, so the library will do it for you without any external libraries.
- Command Handling
  - Too lazy to code your own command handler? Wumpcord will supply you with an en-riching commands API!
- Extra utilities
  - Too lazy to make your own utilities (Reaction Menus, etc) or don't wanna add dependencies? Well, Wumpcord fully supports any utility you desire that other libraries don't, out of the box!
- OAuth2 Support
  - Too lazy to implement your own OAuth2 system for a dashboard? Wumpcord supplies extra utilities for making OAuth2 more simplier.

## Example Bot
```js
const { Client } = require('wumpcord');

const client = new Client({
  ws: { intents: ['guilds', 'guildMessages'] },
  shardCount: 'auto',
  token: ''
});

client.on('ready', () => {
  client.user.setStatus('online', {
    name: 'something',
    type: 0
  });

  console.log(`Bot ${client.user.tag} is ready!`);
});

client.on('message', (message) => {
  if (message.content === '!ping') return message.channel.send('Pong!');
});

client.start();
```

## Sharding
There is two ways of sharding your bot:

- Using the [Clustering](#clustering) API
- Using the normal client

### Normal client
Example bot:

```js
const { Client } = require('wumpcord');

const client = new Client({
  ws: { intents: ['guilds', 'guildMessages'] },
  shardCount: 'auto',
  token: ''
});

client.on('ready', () => {
  client.user.setStatus('online', {
    name: 'something',
    type: 0
  });

  console.log(`Bot ${client.user.tag} is ready!`);
});

client.on('message', (message) => {
  if (message.content === '!ping') return message.channel.send('Pong!');
});

client.start();
```

## Clustering
> Only use the API if your bot is over ~10k guilds or more since the Client will error if it's over the cap to use the Clustering API (may change in the future)

This is basically an extension to Wumpcord that allows the ability to cluster your bot without any external dependencies.

### Example Bot
```js
const { clustering: { ClusterClient } } = require('wumpcord');

const client = new ClusterClient({
  workerCount: 1, // How many workers to spawn (default: your CPU core count)
  shardCount: 'auto', // How many shards to spawn (default: fetched from Discord)
  token: '', // Your bot's token
  ws: { intents: ['guilds', 'guildMessages'] }
});

client.on('ready', () => {
  client.user.setStatus('online', {
    name: 'something',
    type: 0
  });

  console.log(`Bot ${client.user.tag} is ready!`);
});

client.on('message', (message) => {
  if (message.content === '!ping') return message.channel.send('Pong!');
});

client.start();
```

## Caching
Caching in Wumpcord is easy to understand until you actually implement it, there are many stuff you can cache but they must be opt using `ClientOptions.cacheType`. If the cache type is disabled or set to `none`, everything under that will be considered `null` or a Collection of key-value pairs of that specific cache

- Guilds
- Users
- Channels
- Members
- Member Roles
- Voice State
- Attachments
- Permission Overwrites
- Emojis
- Messages
- Presences
- Presence Activity
- User Typings
- Guild Invites

## Commands
This is the documentation of the Commands API, provided by Wumpcord.

Inspiration of this framework; courtesy to [discord.js-commando](https://github.com/discordjs/Commando).

### Type Readers
A "type reader" is a class to handle any argument-specific stuff, like reading a string or something. List shows what is built-in and will be injected when the bot starts:

- API-related
  - `command`
  - `module`
- Discord-related
  - `emoji`
  - `member`
  - `role`
  - `text`
  - `voice`
  - `user`
- Normal
  - `boolean`
  - `double`
  - `integer`
  - `string`

You can combine readers into a **Union Literal** reader, which will filter/parse all arguments in that literal, using the pipe syntax. (i.e: `string|user` -> String | Wumpcord.Entities.User)

You can create your own and inject it using the `readers` option in [CommandClientOptions], example is below:

```js
// reader.js
const { commands: { TypeReader } } = require('wumpcord');

module.exports = class MyTypeReader extends TypeReader {
  constructor(client) {
    super(client, 'name', ['alias1', 'alias2']);
  }

  validate(ctx, val, arg) {
    // valiation logic here, must return a boolean
  }

  parse(ctx, val, arg) {
    // parse logic here, async/await is supported
  }
};

// index.js
const { commands: { CommandClient } } = require('wumpcord');
const MyTypeReader = require('path/to/reader');

new CommandClient({
  readers: [MyTypeReader] // or a string that has to be a relative path!
}).load();
```

## Maintainers
- [August](https://floofy.dev)
- [Ice](https://github.com/IceeMC)

## Testers
None.

## License
**Wumpcord** is released under the MIT License. Read [here](/LICENSE) for more information.
