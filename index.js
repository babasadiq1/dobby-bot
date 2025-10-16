import { Client, GatewayIntentBits, Routes, SlashCommandBuilder } from "discord.js";
import { REST } from "@discordjs/rest";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

// 🧩 ENV Variables
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const FIREWORKS_API_KEY = process.env.FIREWORKS_API_KEY;
const FIREWORKS_MODEL = process.env.FIREWORKS_MODEL || "accounts/sentientfoundation-serverless/models/dobby-mini-unhinged-plus-llama-3-1-8b";

// 🧠 Create Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// 🛠️ Commands
const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),

  new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask the Sentient Dobby AI a question.")
    .addStringOption(option =>
      option.setName("prompt")
        .setDescription("Type your question here.")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("model")
    .setDescription("Displays the current Sentient model in use."),
].map(command => command.toJSON());

// 🪄 Register Commands
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("⚙️ Registering commands...");
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("✅ Commands registered successfully!");
  } catch (error) {
    console.error("❌ Error registering commands:", error);
  }
})();

// 🧩 Handle Commands
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === "ping") {
    await interaction.reply("🏓 Pong!");
  }

  if (commandName === "model") {
    await interaction.reply(`🤖 Current Sentient model: \`${FIREWORKS_MODEL}\``);
  }

  if (commandName === "ask") {
    const prompt = interaction.options.getString("prompt");
    await interaction.deferReply();

    try {
      const response = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${FIREWORKS_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: FIREWORKS_MODEL,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 300
        })
      });

      const data = await response.json();

      if (data?.choices?.[0]?.message?.content) {
        await interaction.editReply(`💬 **Dobby:** ${data.choices[0].message.content}`);
      } else {
        await interaction.editReply("⚠️ I didn’t get a response from Sentient. Try again!");
      }
    } catch (error) {
      console.error(error);
      await interaction.editReply("❌ Error connecting to Sentient API.");
    }
  }
});

// 🌐 Login
client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.login(TOKEN);
