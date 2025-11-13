const axios = require('axios');

class LlamaClient {
  constructor(apiUrl, modelName) {
    this.apiUrl = apiUrl;
    this.modelName = modelName;
  }

  async generate(prompt, context = []) {
    try {
      // Build conversation context for Llama 3.1
      let systemPrompt = `You are a friendly and sometimes funny Discord bot. Respond naturally to conversations. Keep responses concise (1-3 sentences max). You can suggest GIFs by including "[GIF: search term]" in your response when appropriate.`;

      let conversationHistory = '';
      if (context.length > 0) {
        conversationHistory = context.map(msg =>
          `${msg.author}: ${msg.content}`
        ).join('\n');
      }

      // Llama 3.1 uses a better prompt format
      let fullPrompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

${systemPrompt}<|eot_id|>`;

      if (conversationHistory) {
        fullPrompt += `<|start_header_id|>context<|end_header_id|>

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
          top_p: 0.9,
          top_k: 40,
          num_predict: 150,
          stop: ['<|eot_id|>', '<|end_of_text|>']
        }
      }, {
        timeout: 30000 // 30 second timeout
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
