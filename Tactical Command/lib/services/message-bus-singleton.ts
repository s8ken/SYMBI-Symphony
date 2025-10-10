import { EnhancedMessageBus } from './enhanced-message-bus'

// Enhanced singleton instance for the message bus
let messageBusInstance: EnhancedMessageBus | null = null

export function getMessageBus(): EnhancedMessageBus {
  if (!messageBusInstance) {
    messageBusInstance = new EnhancedMessageBus()
  }
  return messageBusInstance
}

export function resetMessageBus(): void {
  messageBusInstance = null
}
