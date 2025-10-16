import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import 'dotenv/config';

const commands = [
  new SlashCommandBuilder()
    .setName('dobby')
    .setDescription('Ask Sentient Dobby anything')
    .addStringOption(option =>
      option.setName('prompt')
        .setDescription('Your question or message')
        .setRequired(true)
    )
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function register() {
  try {
    console.log('Registering /dobby command...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log('✅ Command registered successfully!');
  } catch (err) {
    console.error('Error registering commands:', err);
  }
}

register();
