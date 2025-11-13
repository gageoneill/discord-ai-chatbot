const axios = require('axios');

class GifSearcher {
  constructor(tenorApiKey) {
    this.tenorApiKey = tenorApiKey;
    this.tenorBaseUrl = 'https://tenor.googleapis.com/v2';
  }

  async searchGif(query, limit = 1) {
    if (!this.tenorApiKey || this.tenorApiKey === 'your_tenor_api_key_here') {
      console.log('Tenor API key not configured, skipping GIF search');
      return null;
    }

    try {
      const response = await axios.get(`${this.tenorBaseUrl}/search`, {
        params: {
          q: query,
          key: this.tenorApiKey,
          client_key: 'discord-ai-chatbot',
          limit: limit,
          media_filter: 'gif',
          contentfilter: 'medium'
        },
        timeout: 5000
      });

      if (response.data && response.data.results && response.data.results.length > 0) {
        // Return the GIF URL
        const gif = response.data.results[0];
        return gif.media_formats.gif.url;
      }

      return null;
    } catch (error) {
      console.error('Error searching for GIF:', error.message);
      return null;
    }
  }

  // Extract GIF search terms from bot response
  extractGifQuery(text) {
    const gifMatch = text.match(/\[GIF:\s*([^\]]+)\]/i);
    if (gifMatch && gifMatch[1]) {
      return gifMatch[1].trim();
    }
    return null;
  }

  // Remove GIF tags from text
  removeGifTags(text) {
    return text.replace(/\[GIF:\s*[^\]]+\]/gi, '').trim();
  }
}

module.exports = GifSearcher;
