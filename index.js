// index.js
// Discord bot using Fireworks Dobby 8B (via Fireworks API)

import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import fetch from 'node-fetch';

// Load environment variables
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const FIREWORKS_API_KEY = process.env.FIREWORKS_API_KEY;
const FIREWORKS_MODEL_ID = process.env.FIREWORKS_MODEL_ID;

if (!DISCORD_TOKEN || !FIREWORKS_API_KEY || !FIREWORKS_MODEL_ID) {
  console.error('❌ Missing environment variables! Check your .env file.');
  process.exit(1);
}

// Create Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Register /ask command
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  const cmd = new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask Dobby anything!')
    .addStringOption(opt =>
      opt.setName('prompt')
        .setDescription('Your question or prompt')
        .setRequired(true)
    );

  try {
    const app = await client.application?.fetch();
    const clientId = app?.id;
    if (!clientId) throw new Error('Could not get client ID');

    await rest.put(Routes.applicationCommands(clientId), { body: [cmd.toJSON()] });
    console.log('✅ Slash command /ask registered successfully.');
  } catch (err) {
    console.error('❌ Failed to register slash commands:', err);
  }
}

client.once('ready', async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  await registerCommands();
});

// Handle /ask command
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === 'ask') {
    const prompt = interaction.options.getString('prompt', true);
    await interaction.deferReply();

    try {
      // Build Fireworks request
      const body = {
        model: FIREWORKS_MODEL_ID,
        messages: [
          { role: 'system', content: 'You are Dobby, a helpful assistant created by Sentient.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 512
      };

      // Send request to Fireworks
      const res = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIREWORKS_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('🔥 Fireworks error:', res.status, text);
        await interaction.editReply('⚠️ Model request failed. Please try again later.');
        return;
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || '⚠️ No response from model.';
      const safeReply = reply.length > 1900 ? reply.slice(0, 1900) + '…' : reply;

      await interaction.editReply(safeReply);
    } catch (err) {
      console.error('⚠️ Error calling Fireworks:', err);
      await interaction.editReply('⚠️ Something went wrong while contacting Dobby.');
    }
  }
});

client.login(DISCORD_TOKEN);
