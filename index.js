// index.js
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from "discord.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

// Discord client setup
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Define slash commands
const commands = [
  new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask Sentient AI a question")
    .addStringOption(option =>
      option.setName("prompt")
        .setDescription("Your question for Dobby")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("info")
    .setDescription("Learn about Dobby and its creator"),
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check if Dobby is online")
].map(command => command.toJSON());

// Register slash commands
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("✅ Slash commands registered successfully.");
  } catch (error) {
    console.error("❌ Error registering commands:", error);
  }
})();

// When bot is ready
client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: "Sentient Swarm 🌌", type: 3 }],
    status: "online"
  });
});

// Handle interactions
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    // /ask command
    if (commandName === "ask") {
      const prompt = interaction.options.getString("prompt");
      await interaction.deferReply();

      const response = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.FIREWORKS_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "accounts/sentientfoundation-serverless/models/dobby-mini-unhinged-plus-llama-3-1-8b",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 300
        })
      });

      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content || "⚠️ No response from Dobby.";

      await interaction.editReply(reply);
    }

    // /info command
    else if (commandName === "info") {
      await interaction.reply({
        embeds: [{
          title: "🤖 Dobby AI Assistant",
          description:
            "Built by **[web3sadiq](https://x.com/web3sadiq)** — part of the Sentient ecosystem 🧠\n\n" +
            "• 🔗 Powered by [Fireworks AI](https://fireworks.ai)\n" +
            "• 🌌 Connected to Sentient Swarm\n" +
            "• 💬 Use `/ask` to chat with Dobby AI",
          color: 0x5865F2,
          footer: { text: "Made with ❤️ by web3sadiq" }
        }]
      });
    }

    // /ping command
    else if (commandName === "ping") {
      await interaction.reply("🏓 Pong! Dobby is alive and connected to the Sentient grid.");
    }
  } catch (error) {
    console.error("⚠️ Error handling command:", error);
    if (interaction.deferred) {
      await interaction.editReply("⚠️ Something went wrong. Try again later.");
    } else {
      await interaction.reply("⚠️ Something went wrong. Try again later.");
    }
  }
});

// Login bot
client.login(process.env.DISCORD_TOKEN);
