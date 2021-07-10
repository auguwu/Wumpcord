# WARNING
**wumpcord** has been deprecated due to Discord's API changes being too fast paced for the limited time I have.

# Wumpcord
> 🚣 **Flexible, type-safe, and lightweight Discord API library made in TypeScript**

## Installation
You can install **Wumpcord** under NPM, as follows:

```sh
$ npm i --no-optional wumpcord
```

If you wish to install indev builds (that are most likely buggy), you can install them using:

```sh
$ npm i --no-optional wumpcord@indev
```

### Features
Specific features require extra dependencies, this is a list that requires them

#### Optional Dependencies
- `erlpack`
  - Required: No
  - Native: Yes
  - Alternative: **JSON** (built-in)

## Need Support?
You can join the server below and join in #support under the **Wumpcord** category

[![discord embed owo](https://discord.com/api/v8/guilds/824066105102303232/widget.png?style=banner3)](https://discord.gg/ATmjFH9kMH)

## Example Bot
```js
const { Client } = require('wumpcord');
const client = new Client({
  intents: ['guilds', 'guildMessages'],
  token: ''
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

## Testers
None at the moment.

## License
**Wumpcord** is released under the [MIT](/LICENSE) License. :sparkling_heart:
