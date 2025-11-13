class ContextManager {
  constructor(maxMessages = 10) {
    this.maxMessages = maxMessages;
    this.contexts = new Map(); // channelId -> message array
  }

  addMessage(channelId, author, content) {
    if (!this.contexts.has(channelId)) {
      this.contexts.set(channelId, []);
    }

    const context = this.contexts.get(channelId);

    context.push({
      author,
      content,
      timestamp: Date.now()
    });

    // Keep only the last N messages
    if (context.length > this.maxMessages) {
      context.shift();
    }
  }

  getContext(channelId) {
    return this.contexts.get(channelId) || [];
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
