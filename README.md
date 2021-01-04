# Wumpcord
> :rowboat: **Flexible, type-safe, and lightweight Discord API library made in TypeScript**

## Features
- Command Handling: Tired of using a command handler to add extra dependencies? Wumpcord has that built-in, similar API to discord.js-commando.
- Clustering Support: Tired of build your own [clustering](https://nodejs.org/api/cluster.html) library to your bot? Wumpcord has clustering support built-in with a modular system to plug-in-play methods with IPC and Redis Pub/Sub support.
- Extra Utilities: Wumpcord bundles in with extra utilities like a Reaction Handler and a Message Collector.

## Installation
You can install **Wumpcord** under NPM, as follows:

```sh
# NPM
$ npm i wumpcord

# Yarn
$ yarn add wumpcord
```

If you need Voice Support, install `tweetnacl` (or `node-opus` if using OPUS encoding) to make it work or it'll throw an error if you any voice methods (`Client.joinChannel`, `Guild.createVoiceConnection`, `VoiceChannel.join`, etc)

## Need Support?
You can join the server below and join in #support under the **Wumpcord** category

[![discord embed owo](https://discord.com/api/v8/guilds/382725233695522816/widget.png?style=banner3)](https://discord.gg/yDnbEDH)

## Example Bot
Coming Soon.

## Maintainers
- [August](https://floofy.dev)
- [Ice](https://github.com/IceeMC)

## Testers
None at the moment.

## License
**Wumpcord** is released under the [MIT](/LICENSE) License. <3
