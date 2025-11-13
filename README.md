# Local Llama Discord Chatbot

A Discord bot powered by your local Llama 3.1 model that can chat naturally, understand conversation context, and send funny GIFs!

## Features

- **AI-Powered Conversations**: Uses your locally installed Llama 3.1 model for natural responses
- **Context Awareness**: Remembers recent conversation history for more coherent interactions
- **GIF Support**: Can suggest and send funny GIFs using Tenor API
- **Flexible Responses**: Responds to mentions, prefix commands, and randomly joins conversations
- **Lightweight**: Built with Node.js and minimal dependencies

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Local Llama Model** - You need a running Llama server (e.g., [Ollama](https://ollama.ai/))
3. **Discord Bot Token** - Create a bot at [Discord Developer Portal](https://discord.com/developers/applications)

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd local-llama-discord-chatbot
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment:
```bash
cp .env.example .env
```

4. Edit `.env` and fill in your configuration:
```env
DISCORD_TOKEN=your_discord_bot_token_here
LLAMA_API_URL=http://localhost:11434/api/generate
LLAMA_MODEL_NAME=llama3.1:8b
TENOR_API_KEY=your_tenor_api_key_here  # Optional
```

## Setting Up Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to "Bot" section and click "Add Bot"
4. Under "Token", click "Copy" to get your bot token
5. Enable these Privileged Gateway Intents:
   - Message Content Intent
   - Server Members Intent (optional)
6. Go to "OAuth2" > "URL Generator"
7. Select scopes: `bot`
8. Select permissions: `Send Messages`, `Read Messages/View Channels`, `Read Message History`
9. Copy the generated URL and open it to invite the bot to your server

## Setting Up Local Llama Model

### Option 1: Using Ollama (Recommended)

1. Install Ollama from [ollama.ai](https://ollama.ai/)
2. Pull the Llama 3.1 model:
```bash
ollama pull llama3.1:8b
```
3. The server runs automatically on `http://localhost:11434`

Note: If you already have Llama 3.1 installed, just make sure Ollama is running with `ollama serve`

### Option 2: Other Llama Servers

If you're using a different Llama server, update the `LLAMA_API_URL` in your `.env` file to match your server's endpoint.

## Getting Tenor API Key (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Tenor API"
4. Create credentials (API Key)
5. Add the key to your `.env` file

Without a Tenor API key, the bot will still work but won't send GIFs.

## Usage

### Manual Start

Start the bot:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

### Auto-Start on Windows Login (Recommended)

To automatically start the bot when you log into Windows:

1. **Run the setup script once**:
   - Double-click `create-startup-shortcut.bat`
   - This creates a shortcut in your Startup folder

2. **The bot will now auto-start** when you log into Windows

3. **Prevents duplicate instances** - The startup script checks if the bot is already running

### Control Scripts

- **Start bot**: Double-click `start-bot.bat` (checks for duplicates)
- **Stop bot**: Double-click `stop-bot.bat` (kills all instances)

To disable auto-start, delete the shortcut from:
`C:\Users\<YourName>\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`

### Interacting with the Bot

The bot will respond to:

1. **Direct mentions**: `@YourBot hello!`
2. **Prefix commands**: `!ask what's up?` (default prefix is `!`)
3. **Random responses**: Sometimes responds naturally to keep conversations lively

### Configuration Options

Edit `.env` to customize:

- `BOT_PREFIX`: Command prefix (default: `!`)
- `MAX_CONTEXT_MESSAGES`: How many messages to remember (default: 10)
- `RESPONSE_CHANCE`: Probability of random responses (default: 0.3 = 30%)
- `LLAMA_MODEL_NAME`: Your Llama model name (e.g., `llama3.1:8b`, `llama3.1:7b`)

## Project Structure

```
local-llama-discord-chatbot/
├── src/
│   ├── index.js                    # Main bot entry point
│   ├── llama.js                    # Llama model integration
│   ├── gifSearch.js                # GIF search functionality
│   └── contextManager.js           # Conversation context tracking
├── start-bot.bat                   # Start bot (prevents duplicates)
├── stop-bot.bat                    # Stop all bot instances
├── create-startup-shortcut.bat     # Setup auto-start on login
├── .env.example                    # Environment template
├── .gitignore
├── package.json
└── README.md
```

## Troubleshooting

### Bot doesn't respond
- Check if the bot has proper permissions in Discord
- Verify "Message Content Intent" is enabled in Discord Developer Portal
- Make sure the bot is online (check Discord member list)

### Llama connection fails
- Ensure your Llama server is running (`ollama serve` or equivalent)
- Verify the `LLAMA_API_URL` matches your server address
- Check if the model name is correct (`ollama list` to see available models)

### GIFs don't work
- Verify your Tenor API key is correct
- The bot will work without GIFs if the API key is not set

### Multiple responses / Duplicate messages
- You likely have multiple bot instances running
- Run `stop-bot.bat` to kill all instances
- Use `start-bot.bat` instead of `npm start` to prevent duplicates

## License

ISC

## Contributing

Feel free to open issues or submit pull requests!
