# Wumpcord
> :rowboat: **| Flexible and type-safe Discord API library made in TypeScript**

## Features
- Not cached by default
  - Everything is not cached by default (guilds, users, etc), you'll have to enable it with the stuff you want cached.
- Flexibility
  - You can combine both worlds of [discord.js](https://discord.js.org) and [Eris](https://abal.moe/Eris) with 1 simple library. Like discord.js' Structures API and Eris' simplistic sharding API.
- Clustering out of the box
  - You can opt to using the Clustering API, so the library will do it for you without any external libraries.

## Example Bot
```js
const { Client, GatewayIntent, ActivityStatus } = require('wumpcord');

const client = new Client({
  token: '',
  ws: { intents: [GatewayIntent.GUILDS, GatewayIntent.GUILD_MESSAGES] }
});

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

## Sharding
There is two ways of sharding your bot:

- Using the [Clustering](#clustering) API
- Using the ShardedClient

### ShardedClient
The sharded client is basically an extended client with more properties related to sharding.

```js
const { ShardedClient, GatewayIntent, ActivityStatus } = require('wumpcord');

const client = new ShardedClient({
  token: '',
  ws: { intents: [GatewayIntent.GUILDS, GatewayIntent.GUILD_MESSAGES] },
  shardCount: 'auto'
});

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

## Clustering
> Only use the API if your bot is over ~10k guilds or more since the ShardedClient will error if it's over the cap to use the Clustering API (may change in the future)

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

## License
**Wumpcord** is released under the MIT License. Read [here](/LICENSE) for more information.