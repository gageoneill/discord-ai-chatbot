const axios = require('axios');

class LlamaClient {
  constructor(apiUrl, modelName, lmStudioUrl = null, lmStudioModel = null) {
    this.ollamaUrl = apiUrl;
    this.lmStudioUrl = lmStudioUrl;
    this.modelName = modelName;

    // Model registry: maps model names to their backend configuration
    this.modelRegistry = {
      // Ollama models
      'llama3.1:8b': { backend: 'ollama', url: this.ollamaUrl },
      'llama3.1': { backend: 'ollama', url: this.ollamaUrl },
      'mistral:7b': { backend: 'ollama', url: this.ollamaUrl },
      'mistral': { backend: 'ollama', url: this.ollamaUrl },

      // LM Studio models (add your models here)
      'mirothinker': { backend: 'lmstudio', url: this.lmStudioUrl, modelName: lmStudioModel },
    };
  }

  // Get backend configuration for a model
  getModelConfig(modelName) {
    // Check if model is in registry
    if (this.modelRegistry[modelName]) {
      return this.modelRegistry[modelName];
    }

    // Default to Ollama if not found
    console.log(`⚠️  Model "${modelName}" not in registry, assuming Ollama`);
    return { backend: 'ollama', url: this.ollamaUrl };
  }

  async generate(prompt, context = [], summary = null, searchResults = null) {
    try {
      // Get model configuration
      const modelConfig = this.getModelConfig(this.modelName);
      console.log(`🤖 Using ${modelConfig.backend} backend for model: ${this.modelName}`);

      // Enhanced system prompt with better instructions for context understanding
      let systemPrompt = `You are a friendly and sometimes funny Discord bot named after the server. You engage naturally in conversations and remember what was discussed.

Key Instructions:
- Pay close attention to the conversation history and context
- Reference previous messages when relevant to show you're following along
- Understand who said what and track the conversation flow
- Keep responses concise (1-3 sentences max) but contextually aware
- If someone asks about something mentioned earlier, recall and reference it
- Adapt your tone to match the conversation (casual, helpful, funny, etc.)
- Use emojis naturally to add personality 😊

Search Results Usage (CRITICAL - Follow exactly!):
- When you receive web search results, you MUST ONLY use information from those exact results
- DO NOT make up information, dates, or URLs - only use what's provided in the search results
- DO NOT hallucinate or invent news stories that aren't in the search results
- DO NOT mention sources like "Google News", "Polygon", "IGN", or ANY website not in the search results
- DO NOT create fake URLs or modify the URLs provided
- ALWAYS copy and paste the EXACT URLs from the search results using <URL> format
- Example: "According to [Site from search results] <[exact URL from results]>, [info from snippet]"
- If you don't see a source in the search results, DO NOT mention it
- If the search results don't contain good information, say "I couldn't find current information about that"
- Include 1-2 relevant links maximum from the actual search results provided
- NEVER use reference numbers like (1) or (2) - use actual URLs only

GIF Usage:
- If the user's message contains the word "gif" or "meme", they're asking for a GIF - ALWAYS give them one!
- When giving a requested GIF, look at the conversation context and pick something funny/relevant to what was discussed
- Keep your text response very brief when sending a GIF (1 short sentence or just an emoji)
- EXACT FORMAT REQUIRED: [GIF: search term] - Must include "GIF:" prefix inside brackets
- WRONG: [Distracted Boyfriend] or [laughing] or just "GIF: something"
- CORRECT: [GIF: distracted boyfriend] or [GIF: laughing hysterically]
- The [GIF: ...] tag will be replaced with an actual GIF, so don't describe it in your text
- Put the GIF tag on a new line at the end of your message
- For unrequested GIFs: only use when genuinely funny or perfectly captures the moment
- Be creative with GIF search terms - use the conversation context to pick relevant/funny ones!`;

      let conversationHistory = '';
      if (context.length > 0) {
        conversationHistory = context.map(msg => {
          const role = msg.isBot ? 'Assistant' : 'User';
          const replyInfo = msg.replyTo ? ' (replying to previous message)' : '';
          return `${role} (${msg.author})${replyInfo}: ${msg.content}`;
        }).join('\n');
      }

      // Llama 3.1 uses a better prompt format
      let fullPrompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

${systemPrompt}<|eot_id|>`;

      // Add web search results if available
      if (searchResults && searchResults.length > 0) {
        let searchContext = 'IMPORTANT: Use ONLY these search results. Do NOT make up other sources.\n\n';
        searchResults.forEach((result, index) => {
          searchContext += `Result ${index + 1}:\n`;
          searchContext += `Title: ${result.title}\n`;
          searchContext += `Snippet: ${result.snippet}\n`;
          searchContext += `URL: ${result.link}\n`;
          searchContext += `---\n`;
        });
        searchContext += '\nREMINDER: Use ONLY the URLs and information from the results above. Do NOT mention Google News, Polygon, or any other sources not listed here.';

        fullPrompt += `<|start_header_id|>search_results<|end_header_id|>

${searchContext}<|eot_id|>`;
      }

      // Add conversation summary if available (for very long conversations)
      if (summary) {
        fullPrompt += `<|start_header_id|>conversation_summary<|end_header_id|>

Earlier in this conversation: ${summary}<|eot_id|>`;
      }

      // Add recent conversation history
      if (conversationHistory) {
        fullPrompt += `<|start_header_id|>recent_conversation<|end_header_id|>

${conversationHistory}<|eot_id|>`;
      }

      fullPrompt += `<|start_header_id|>user<|end_header_id|>

${prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

`;

      let response;

      // Call appropriate backend
      if (modelConfig.backend === 'lmstudio') {
        // LM Studio uses OpenAI-compatible API
        const messages = [];
        messages.push({ role: 'system', content: systemPrompt });

        // Add search results
        if (searchResults && searchResults.length > 0) {
          let searchContext = 'IMPORTANT: Use ONLY these search results.\n\n';
          searchResults.forEach((result, index) => {
            searchContext += `Result ${index + 1}:\nTitle: ${result.title}\nSnippet: ${result.snippet}\nURL: ${result.link}\n---\n`;
          });
          messages.push({ role: 'system', content: searchContext });
        }

        // Add conversation history
        if (context.length > 0) {
          context.forEach(msg => {
            const role = msg.isBot ? 'assistant' : 'user';
            messages.push({ role, content: `${msg.author}: ${msg.content}` });
          });
        }

        // Add current prompt
        messages.push({ role: 'user', content: prompt });

        response = await axios.post(modelConfig.url, {
          model: modelConfig.modelName || this.modelName,
          messages: messages,
          temperature: searchResults && searchResults.length > 0 ? 0.3 : 0.7,
          max_tokens: 200,
          stream: false
        }, {
          timeout: 60000
        });

        if (response.data && response.data.choices && response.data.choices[0]) {
          return response.data.choices[0].message.content.trim();
        }
      } else {
        // Ollama API
        response = await axios.post(modelConfig.url, {
          model: this.modelName,
          prompt: fullPrompt,
          stream: false,
          options: {
            temperature: searchResults && searchResults.length > 0 ? 0.3 : 0.7,
            top_p: 0.95,
            top_k: 50,
            num_predict: 200,
            repeat_penalty: 1.1,
            stop: ['<|eot_id|>', '<|end_of_text|>']
          }
        }, {
          timeout: 60000
        });

        if (response.data && response.data.response) {
          return response.data.response.trim();
        }
      }

      return null;
    } catch (error) {
      console.error('Error calling Llama model:', error.message);

      // Fallback responses
      const fallbacks = [
        "I'm having trouble thinking right now... 🤔",
        "My brain is buffering... 🔄",
        "Error 404: Thought not found 😅",
        "I need a coffee break ☕"
      ];

      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
  }

  // Check if Llama is available
  async checkHealth() {
    try {
      const response = await axios.get(this.apiUrl.replace('/api/generate', '/api/tags'), {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

module.exports = LlamaClient;
