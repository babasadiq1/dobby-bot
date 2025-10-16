import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from "discord.js";
import "dotenv/config";
import fetch from "node-fetch";

// --- Load environment variables ---
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const FIREWORKS_API_KEY = process.env.FIREWORKS_API_KEY;

// --- Initialize Discord client ---
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// --- When bot is ready ---
client.once("ready", async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);

  // Register slash command
  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
  const command = new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask the Sentient Dobby 8B model a question.")
    .addStringOption(option =>
      option.setName("question")
        .setDescription("Your question to Dobby")
        .setRequired(true)
    );

  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [command.toJSON()] });
    console.log("✅ Slash command /ask registered successfully.");
  } catch (err) {
    console.error("❌ Failed to register commands:", err);
  }
});

// --- Handle interaction (/ask) ---
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "ask") return;

  const question = interaction.options.getString("question");
  await interaction.deferReply(); // Prevents "Unknown interaction" error

  try {
    const response = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIREWORKS_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "accounts/sentientfoundation-serverless/models/dobby-mini-unhinged-plus-llama-3-1-8b",
        messages: [{ role: "user", content: question }],
        max_tokens: 500
      })
    });

    const data = await response.json();

    if (data?.choices?.[0]?.message?.content) {
      await interaction.editReply(data.choices[0].message.content);
    } else {
      await interaction.editReply("⚠️ Sorry, I didn’t get a proper response from the model.");
      console.error("Unexpected API response:", data);
    }
  } catch (error) {
    console.error("🔥 Error communicating with Fireworks API:", error);
    await interaction.editReply("❌ Something went wrong while fetching the response.");
  }
});

// --- Login to Discord ---
client.login(DISCORD_TOKEN);
