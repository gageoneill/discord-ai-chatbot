const axios = require('axios');
const cheerio = require('cheerio');

class WebSearcher {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  /**
   * Search the web using DuckDuckGo HTML scraping
   * @param {string} query - The search query
   * @param {number} maxResults - Maximum number of results to return (default: 5)
   * @returns {Promise<Array>} Array of search results with title, link, and snippet
   */
  async search(query, maxResults = 5) {
    try {
      console.log(`🔍 Searching for: "${query}"`);

      // DuckDuckGo HTML search
      const response = await axios.get('https://html.duckduckgo.com/html/', {
        params: {
          q: query,
          kl: 'us-en' // Language/region
        },
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const results = [];

      // Parse DuckDuckGo results
      $('.result').each((index, element) => {
        if (results.length >= maxResults) return false;

        const $result = $(element);
        const $titleLink = $result.find('.result__a');
        const $snippet = $result.find('.result__snippet');

        const title = $titleLink.text().trim();
        const link = $titleLink.attr('href');
        const snippet = $snippet.text().trim();

        if (title && link && snippet) {
          results.push({
            title,
            link,
            snippet
          });
        }
      });

      console.log(`✅ Found ${results.length} results`);
      return results;

    } catch (error) {
      console.error('Web search error:', error.message);
      return [];
    }
  }

  /**
   * Detect if a message is asking for information that would benefit from web search
   * @param {string} message - The user's message
   * @returns {boolean} True if search would be helpful
   */
  shouldSearch(message) {
    const lowerMessage = message.toLowerCase();

    // Keywords that indicate a search would be helpful
    const searchIndicators = [
      'search for',
      'look up',
      'find information',
      'what is',
      'who is',
      'when did',
      'where is',
      'how to',
      'tell me about',
      'explain',
      'current',
      'latest',
      'today',
      'recent',
      'new',
      'news',
      'top',
      'information on',
      'details about',
      'price of',
      'weather in',
      'definition of',
      'happening',
      'update'
    ];

    // Check if message contains search indicators
    const hasSearchIndicator = searchIndicators.some(indicator =>
      lowerMessage.includes(indicator)
    );

    // Check if message is a question
    const isQuestion = lowerMessage.includes('?') ||
                       lowerMessage.startsWith('what') ||
                       lowerMessage.startsWith('who') ||
                       lowerMessage.startsWith('when') ||
                       lowerMessage.startsWith('where') ||
                       lowerMessage.startsWith('how') ||
                       lowerMessage.startsWith('why');

    return hasSearchIndicator || isQuestion;
  }

  /**
   * Format search results for the AI model
   * @param {Array} results - Array of search results
   * @param {string} query - The original search query
   * @returns {string} Formatted search results
   */
  formatResultsForAI(results, query) {
    if (!results || results.length === 0) {
      return `No search results found for "${query}".`;
    }

    let formatted = `Search results for "${query}":\n\n`;

    results.forEach((result, index) => {
      formatted += `${index + 1}. ${result.title}\n`;
      formatted += `   ${result.snippet}\n`;
      formatted += `   Source: ${result.link}\n\n`;
    });

    return formatted;
  }

  /**
   * Format search results for Discord message
   * @param {Array} results - Array of search results
   * @returns {string} Formatted search results for Discord
   */
  formatResultsForDiscord(results) {
    if (!results || results.length === 0) {
      return 'No results found.';
    }

    let formatted = '**Search Results:**\n\n';

    results.forEach((result, index) => {
      formatted += `**${index + 1}. ${result.title}**\n`;
      formatted += `${result.snippet}\n`;
      formatted += `<${result.link}>\n\n`;
    });

    return formatted;
  }
}

module.exports = WebSearcher;
