# Wumpcord
> :rowboat: **| Flexible, type-safe, and lightweight Discord API library**

## Features
- Not cached by default
  - Everything is not cached by default (guilds, users, etc), you'll have to enable it with the stuff you want cached.
- Command Handling
  - Too lazy to code your own command handler? Wumpcord will supply you with an en-riching commands API!
- Extra utilities
  - Too lazy to make your own utilities (Reaction Menus, etc) or don't wanna add dependencies? Well, Wumpcord fully supports any utility you desire that other libraries don't, out of the box!

## Need Support?
You can join the server below and join in #support under the **Wumpcord** category

[![discord embed owo](https://discord.com/api/v8/guilds/382725233695522816/widget.png?style=banner3)](https://discord.gg/yDnbEDH)

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
> :warning: **| This section is under expiremental features, this is not a finalised version.**
>
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

- Guilds (`guild`)
- Users (`user`)
- Channels (`channel`)
- Members (`member`)
- Member Roles (`member:role`)
- Voice State (`voice:state`)
- Emojis (`emoji`)
- Messages (`message`)
- Presences (`presence`)
- User Typings (`typings`)

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

## OAuth2 API
> :warning: **| This section is under expiremental features, this is not a finalised version.**

Wumpcord provides a `OAuth2Client` to do stuff related to Discord's API, you can view the [documentation](https://docs.augu.dev/Wumpcord/notes#oauth2) for more information.

To initialise it, we need to use the `oauth2` namespace when importing the library, so like:

```js
// CommonJS
const { oauth } = require('wumpcord');

// ESNext
import { oauth2 } from 'wumpcord';
```

Now, we have to initialise the client in the `oauth2` namespace, here's how we can do it:

```js
const client = new oauth2.OAuth2Client({
  // Redirect URL when we successfully gotten an access token (used in express middleware)
  redirectUrl: '',

  // Callback URL to get the access token (used in express middleware)
  callbackUrl: '',

  // Cache type, view Caching for more information
  cacheType: 'all',

  // The client's secret (required)
  clientSecret: '',

  // If we should provide a `&state` param when redirecting
  // this will also validat ethe state
  useState: true,

  // The client's ID
  clientID: '',

  // The scopes used
  scopes: [],
});
```

### Caching
In the oauth2 namespace, we also have ways to make it minimal without any memory leaks! It uses the same concept of the
[WebSocketClient]'s caching system.

- Guilds
- Users

### Express
You heard in the example above saying "(used in express middleware)", the oauth2 namespace has an Express handler
built-in to not re-invent the wheel, so you can just apply `OAuth2Client.express` to the middleware stack and boom!

The library will automatically listen for the [callbackUrl] set in the client options when initialising
a new instance. We also have lifecycle hooks that are required if you wanna do stuff like getting a
user from the database or something.

#### Express Example
```js
const { oauth2 } = require('wumpcord');
const express = require('express');

const client = new oauth2.OAuth2Client({
  redirectUrl: '/discord/success',
  callbackUrl: '/discord/callback',
  cacheType: 'all',
  clientSecret: '',
  useState: true,
  clientID: '',
  scopes: [],
  onError(req, res, error) {
    
  },
  onSuccess(req, res, accessToken) {
    
  }
});

const app = express();

app.use(express.json());
app.use(client.express);

app.get('/discord', (_, res) => res.redirect(client.authorizationUrl));
app.get('/discord/success', (_, res) => res.status(200).send('Success!'));

app.listen(3000, () => console.log('http://localhost:3000'));

```

## Maintainers
- [August](https://floofy.dev)
- [Ice](https://github.com/IceeMC)

## Testers
None at the moment.

## License
**Wumpcord** is released under the MIT License. Read [here](/LICENSE) for more information.
