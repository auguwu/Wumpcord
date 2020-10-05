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

## Example Bot
```js
const { Client } = require('wumpcord');

const client = new Client('', {
  ws: { intents: ['guilds', 'guildMessages'] },
  shardCount: 'auto'
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

const client = new Client('', {
  ws: { intents: ['guilds', 'guildMessages'] },
  shardCount: 'auto'
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

### Services
Services are basically "jobs" when the API emits when a certain task is done (i.e: worker #1 is finished readying up)

An example service would be like:

```js
const { clustering: { ClusterService, ServiceType } } = require('wumpcord');

module.exports = class MyService extends ClusterService {
  constructor() {
    super(ServiceType.WORKER_READY);
  }

  run(workerID) {
    console.log(`Worker #${workerID} has readyed up!`);
  }
}
```

This will tell the library to run this specific service when the ClusteringClient has finished readying up a worker.

### Example Bot
```js
const { clustering: { ClusterClient }, GatewayIntent } = require('wumpcord');

const client = new ClusterClient({
  workerCount: 1, // How many workers to spawn (default: your CPU core count)
  shardCount: 'auto', // How many shards to spawn (default: fetched from Discord)
  token: '', // Your bot's token
  intents: [GatewayIntent.GUILDS, GatewayIntents.GUILD_MESSAGES], // The intents to use
  services: [MyService] // A list of services to use (or a string as a relative path)
});

client.on('serviceReady', (service) => console.log(`Service ${service.type} has been initialised!`));
client.on('serviceDisposed', (service) => console.log(`Service ${service.type} has been disposed.`));

client.on('ready', () => {
  client.user.setStatus('online', {
    name: 'something',
    type: ActivityStatus.PLAYING
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

## License
**Wumpcord** is released under the MIT License. Read [here](/LICENSE) for more information.