require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const LlamaClient = require('./llama');
const GifSearcher = require('./gifSearch');
const ContextManager = require('./contextManager');
const WebSearcher = require('./webSearch');

// Configuration
const config = {
  discordToken: process.env.DISCORD_TOKEN,
  llamaApiUrl: process.env.LLAMA_API_URL || 'http://localhost:11434/api/generate',
  llamaModelName: process.env.LLAMA_MODEL_NAME || 'llama2:7b',
  tenorApiKey: process.env.TENOR_API_KEY,
  botPrefix: process.env.BOT_PREFIX || '!',
  maxContextMessages: parseInt(process.env.MAX_CONTEXT_MESSAGES) || 10,
  responseChance: parseFloat(process.env.RESPONSE_CHANCE) || 0.3,
  enableWebSearch: process.env.ENABLE_WEB_SEARCH !== 'false' // Enabled by default
};

// Initialize clients
const discord = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

const llama = new LlamaClient(config.llamaApiUrl, config.llamaModelName);
const gifSearcher = new GifSearcher(config.tenorApiKey);
const contextManager = new ContextManager(config.maxContextMessages);
const webSearcher = new WebSearcher();

// Detect if a message is a simple request that doesn't need full context
function detectSimpleRequest(message) {
  const lowerMessage = message.toLowerCase();

  // Simple greetings
  const greetings = ['hi', 'hello', 'hey', 'sup', 'yo', 'wassup', 'hiya'];
  if (greetings.some(g => lowerMessage === g || lowerMessage === `${g}!`)) {
    return true;
  }

  // Quick reactions
  const reactions = ['lol', 'lmao', 'rofl', 'haha', 'nice', 'cool', 'wow', 'bruh', 'oof', 'rip'];
  if (reactions.some(r => lowerMessage === r || lowerMessage === `${r}!`)) {
    return true;
  }

  // GIF/meme requests
  if (lowerMessage.includes('gif') || lowerMessage.includes('meme') || lowerMessage.includes('react')) {
    return true;
  }

  // Very short messages (likely quick interactions)
  if (message.split(' ').length <= 3) {
    return true;
  }

  return false;
}

// Bot ready event
discord.once('ready', async () => {
  console.log(`✅ Bot logged in as ${discord.user.tag}`);

  // Check Llama availability
  const llamaAvailable = await llama.checkHealth();
  if (llamaAvailable) {
    console.log('✅ Llama model is accessible');
  } else {
    console.warn('⚠️  Warning: Could not connect to Llama model at', config.llamaApiUrl);
    console.warn('   Make sure your Llama server is running (e.g., Ollama)');
  }

  // Clean up old contexts periodically (more aggressive for fresher conversations)
  setInterval(() => {
    contextManager.cleanOldContexts(900000); // 15 minutes instead of 1 hour
  }, 300000); // Every 5 minutes
});

// Message handler
discord.on('messageCreate', async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  const content = message.content;
  const channelId = message.channel.id;
  const botMentioned = message.mentions.has(discord.user);
  const hasPrefix = content.startsWith(config.botPrefix);

  // Track if this is a reply to another message
  const replyTo = message.reference ? message.reference.messageId : null;

  // Add ALL messages to context (not just ones we respond to)
  // This helps the bot understand ongoing conversations
  contextManager.addMessage(channelId, message.author.username, content, false, replyTo);

  // Only respond when directly mentioned or using prefix
  if (!botMentioned && !hasPrefix) return;

  // Show typing indicator
  await message.channel.sendTyping();

  try {
    // Remove prefix and mentions from the prompt
    let prompt = content
      .replace(new RegExp(`^${config.botPrefix}`), '')
      .replace(new RegExp(`<@!?${discord.user.id}>`), '')
      .trim();

    if (!prompt) {
      prompt = "Hey!";
    }

    // Detect if this is a simple/quick request that doesn't need full context
    const isSimpleRequest = detectSimpleRequest(prompt);

    // Check if web search would be helpful
    let searchResults = null;
    if (config.enableWebSearch && webSearcher.shouldSearch(prompt)) {
      console.log('🔍 Web search triggered for query:', prompt);
      searchResults = await webSearcher.search(prompt, 3); // Get top 3 results

      if (searchResults && searchResults.length > 0) {
        console.log(`✅ Found ${searchResults.length} search results`);
        searchResults.forEach((result, i) => {
          console.log(`   ${i + 1}. ${result.title}`);
          console.log(`      ${result.link}`);
        });
      } else {
        console.log('⚠️  No search results found');
      }
    }

    // Get conversation context - use less context for simple requests
    let context = contextManager.getContext(channelId);
    if (isSimpleRequest) {
      console.log('💬 Simple request detected - using light context');
      context = context.slice(-3); // Only last 3 messages for simple requests
    }
    const summary = contextManager.getSummary(channelId);

    // Generate response from Llama with enhanced context and search results
    const response = await llama.generate(prompt, context, summary, searchResults);

    if (!response) {
      await message.reply("I'm having trouble thinking right now... 🤔");
      return;
    }

    // Check if response contains GIF suggestion
    const gifQuery = gifSearcher.extractGifQuery(response);
    let textResponse = gifSearcher.removeGifTags(response);

    // Add bot response to context with isBot flag
    contextManager.addMessage(channelId, discord.user.username, textResponse, true, replyTo);

    // Send text response
    if (textResponse) {
      await message.reply(textResponse);
    }

    // Search and send GIF if suggested
    if (gifQuery) {
      const gifUrl = await gifSearcher.searchGif(gifQuery);
      if (gifUrl) {
        await message.channel.send(gifUrl);
      }
    }

  } catch (error) {
    console.error('Error handling message:', error);
    await message.reply("Oops! Something went wrong 😅");
  }
});

// Error handling
discord.on('error', (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Login to Discord
if (!config.discordToken) {
  console.error('❌ DISCORD_TOKEN is not set in .env file!');
  process.exit(1);
}

discord.login(config.discordToken)
  .catch((error) => {
    console.error('❌ Failed to login to Discord:', error.message);
    process.exit(1);
  });
