import { InteractionCommandBuilder } from './builders/InteractionCommandBuilder';
import { InteractionOptionBuilder } from './builders/InteractionOptionBuilder';

const option = new InteractionOptionBuilder()
  .setName('an_option')
  .setDescription('This is a option apparently')
  .setType('SUB_COMMAND')
  .isRequired()
  .addOptions([
    new InteractionOptionBuilder()
      .setName('uwu')
      .setDescription('uwu some owos?')
      .setType('BOOLEAN')
      .isRequired(),

    new InteractionOptionBuilder()
      .setName('owo')
      .setDescription('owo some uwus?')
      .setType('SUB_COMMAND_GROUP')
      .addOption(
        new InteractionOptionBuilder()
          .setName('uwu')
          .setDescription('uwu some owos?')
          .setType('BOOLEAN')
          .isRequired()
      )
  ])
  .build();

const slash = new InteractionCommandBuilder()
  .setName('slash')
  .setDescription('This is a slash command.')
  .setDefaultPermission()
  .addOption(option)
  .build();

console.log(slash);
