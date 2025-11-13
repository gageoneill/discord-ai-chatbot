class ContextManager {
  constructor(maxMessages = 10) {
    this.maxMessages = maxMessages;
    this.contexts = new Map(); // channelId -> message array
    this.summaries = new Map(); // channelId -> conversation summary
  }

  addMessage(channelId, author, content, isBot = false, replyTo = null) {
    if (!this.contexts.has(channelId)) {
      this.contexts.set(channelId, []);
    }

    const context = this.contexts.get(channelId);

    context.push({
      author,
      content,
      timestamp: Date.now(),
      isBot,
      replyTo, // Track if this message is a reply to another message
      id: `${channelId}-${Date.now()}-${Math.random()}` // Unique message ID
    });

    // Keep only the last N messages
    if (context.length > this.maxMessages) {
      context.shift();
    }
  }

  getContext(channelId) {
    return this.contexts.get(channelId) || [];
  }

  // Get formatted context for AI with better structure
  getFormattedContext(channelId, includeTimestamps = false) {
    const messages = this.getContext(channelId);

    if (messages.length === 0) {
      return '';
    }

    let formatted = messages.map(msg => {
      const role = msg.isBot ? 'Assistant' : 'User';
      const timeInfo = includeTimestamps ? ` [${new Date(msg.timestamp).toLocaleTimeString()}]` : '';
      const replyInfo = msg.replyTo ? ` (replying to previous message)` : '';

      return `${role} (${msg.author})${timeInfo}${replyInfo}: ${msg.content}`;
    }).join('\n');

    return formatted;
  }

  // Set a summary for long conversations
  setSummary(channelId, summary) {
    this.summaries.set(channelId, summary);
  }

  // Get summary if available
  getSummary(channelId) {
    return this.summaries.get(channelId);
  }

  clearContext(channelId) {
    this.contexts.delete(channelId);
  }

  // Clean up old contexts (optional, to prevent memory leaks)
  cleanOldContexts(maxAgeMs = 3600000) { // 1 hour default
    const now = Date.now();

    for (const [channelId, context] of this.contexts.entries()) {
      if (context.length > 0) {
        const lastMessageTime = context[context.length - 1].timestamp;
        if (now - lastMessageTime > maxAgeMs) {
          this.contexts.delete(channelId);
        }
      }
    }
  }
}

module.exports = ContextManager;
