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
    // Try to match [GIF: search term] - correct format
    const gifMatch = text.match(/\[GIF:\s*([^\]]+)\]/i);
    if (gifMatch && gifMatch[1]) {
      return gifMatch[1].trim();
    }

    // Catch incorrect format: [meme name] without "GIF:"
    const bracketOnlyMatch = text.match(/\[([^\]]+)\]/i);
    if (bracketOnlyMatch && bracketOnlyMatch[1]) {
      // Check if it looks like a GIF reference (common meme names, reactions, etc.)
      const possibleGif = bracketOnlyMatch[1].trim();
      // Only treat as GIF if it's not too long (likely not regular text in brackets)
      if (possibleGif.length < 50 && !possibleGif.includes('\n')) {
        console.log('⚠️  Bot used incorrect bracket format, treating as GIF:', possibleGif);
        return possibleGif;
      }
    }

    // Also try to catch cases where bot just says "GIF:" without brackets
    const looseMatch = text.match(/GIF:\s*([^\n.!?]+)/i);
    if (looseMatch && looseMatch[1]) {
      console.log('⚠️  Bot used loose GIF format, extracting anyway:', looseMatch[1]);
      return looseMatch[1].trim();
    }

    return null;
  }

  // Remove GIF tags from text
  removeGifTags(text) {
    // Remove [GIF: ...] tags (correct format)
    let cleaned = text.replace(/\[GIF:\s*[^\]]+\]/gi, '').trim();

    // Also remove loose "GIF: ..." patterns
    cleaned = cleaned.replace(/GIF:\s*[^\n.!?]+/gi, '').trim();

    // Remove bracket-only patterns that look like GIF references
    // (short text in brackets, likely meme names)
    cleaned = cleaned.replace(/\[[^\]]{1,50}\]/gi, (match) => {
      const content = match.slice(1, -1).trim();
      // Keep brackets if they seem like actual text (too long or contains sentences)
      if (content.length > 50 || content.includes('.') || content.includes(',')) {
        return match;
      }
      // Remove if it looks like a GIF reference
      return '';
    }).trim();

    return cleaned;
  }
}

module.exports = GifSearcher;
