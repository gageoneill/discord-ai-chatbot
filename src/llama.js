const axios = require('axios');

class LlamaClient {
  constructor(apiUrl, modelName) {
    this.apiUrl = apiUrl;
    this.modelName = modelName;
  }

  async generate(prompt, context = [], summary = null, searchResults = null) {
    try {
      // Enhanced system prompt with better instructions for context understanding
      let systemPrompt = `You are a friendly and sometimes funny Discord bot named after the server. You engage naturally in conversations and remember what was discussed.

Key Instructions:
- Pay close attention to the conversation history and context
- Reference previous messages when relevant to show you're following along
- Understand who said what and track the conversation flow
- Keep responses concise (1-3 sentences max) but contextually aware
- If someone asks about something mentioned earlier, recall and reference it
- Adapt your tone to match the conversation (casual, helpful, funny, etc.)
- When provided with web search results, use them to give accurate, up-to-date information
- Cite sources when using search results (e.g., "According to [source]...")
- Use emojis naturally to add personality 😊

GIF Usage (IMPORTANT - Use sparingly!):
- ONLY suggest a GIF when it would be genuinely funny or perfectly captures the moment
- EXACT FORMAT REQUIRED: [GIF: search term] - Must include "GIF:" prefix inside brackets
- WRONG: [Distracted Boyfriend] or [laughing] or just "GIF: something"
- CORRECT: [GIF: distracted boyfriend] or [GIF: laughing hysterically]
- The [GIF: ...] tag will be replaced with an actual GIF, so don't describe it in your text
- Put the GIF tag on a new line at the end of your message
- Examples of GOOD GIF moments: reactions to epic fails, celebrations, dramatic moments, memes
- Examples of BAD GIF moments: regular questions, factual answers, casual chat
- If you're not sure if a GIF fits, DON'T use one - text and emojis are fine!
- Maximum 1-2 GIFs per 10 messages - be selective!`;

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
        let searchContext = 'Web Search Results:\n\n';
        searchResults.forEach((result, index) => {
          searchContext += `${index + 1}. ${result.title}\n`;
          searchContext += `   ${result.snippet}\n`;
          searchContext += `   Source: ${result.link}\n\n`;
        });

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

      const response = await axios.post(this.apiUrl, {
        model: this.modelName,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.95,
          top_k: 50,
          num_predict: 200,
          repeat_penalty: 1.1,
          stop: ['<|eot_id|>', '<|end_of_text|>']
        }
      }, {
        timeout: 60000 // 60 second timeout for larger models
      });

      if (response.data && response.data.response) {
        return response.data.response.trim();
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
