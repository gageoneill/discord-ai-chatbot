const axios = require('axios');

class LlamaClient {
  constructor(apiUrl, modelName) {
    this.apiUrl = apiUrl;
    this.modelName = modelName;
  }

  async generate(prompt, context = [], summary = null) {
    try {
      // Enhanced system prompt with better instructions for context understanding
      let systemPrompt = `You are a friendly and sometimes funny Discord bot named after the server. You engage naturally in conversations and remember what was discussed.

Key Instructions:
- Pay close attention to the conversation history and context
- Reference previous messages when relevant to show you're following along
- Understand who said what and track the conversation flow
- Keep responses concise (1-3 sentences max) but contextually aware
- You can suggest GIFs by including "[GIF: search term]" in your response when appropriate
- If someone asks about something mentioned earlier, recall and reference it
- Adapt your tone to match the conversation (casual, helpful, funny, etc.)`;

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
