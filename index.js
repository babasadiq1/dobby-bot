import express from "express";
import fetch from "node-fetch";
import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} from "discord.js";

// =============== KEEP ALIVE SERVER ===============
const app = express();
app.get("/", (req, res) => res.send("✅ Dobby bot is awake!"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌍 Keep-alive server running on port ${PORT}`));

// =============== DISCORD BOT SETUP ===============
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const FIREWORKS_API_KEY = process.env.FIREWORKS_API_KEY;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// =============== REGISTER COMMAND ===============
client.once("ready", async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
  const command = new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask the Sentient Dobby 8B model a question.")
    .addStringOption(option =>
      option
        .setName("question")
        .setDescription("Your question to Dobby")
        .setRequired(true)
    );

  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: [command.toJSON()],
    });
    console.log("✅ Slash command /ask registered successfully.");
  } catch (err) {
    console.error("❌ Failed to register commands:", err);
  }
});

// =============== COMMAND HANDLER ===============
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "ask") return;

  const question = interaction.options.getString("question");
  await interaction.deferReply(); // prevents "Unknown interaction" error

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

// =============== SELF-PING TO STAY ONLINE ===============
setInterval(() => {
  const url = `https://${process.env.RAILWAY_STATIC_URL || "dobby-bot.up.railway.app"}`;
  fetch(url)
    .then(() => console.log("⏰ Keep-alive ping sent"))
    .catch((err) => console.error("Keep-alive ping failed:", err.message));
}, 240000); // every 4 minutes

// =============== LOGIN ===============
client.login(DISCORD_TOKEN);
