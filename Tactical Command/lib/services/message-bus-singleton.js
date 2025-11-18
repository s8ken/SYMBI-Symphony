"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetMessageBus = exports.getMessageBus = void 0;
const enhanced_message_bus_1 = require("./enhanced-message-bus");
// Enhanced singleton instance for the message bus
let messageBusInstance = null;
function getMessageBus() {
    if (!messageBusInstance) {
        messageBusInstance = new enhanced_message_bus_1.EnhancedMessageBus();
    }
    return messageBusInstance;
}
exports.getMessageBus = getMessageBus;
function resetMessageBus() {
    messageBusInstance = null;
}
exports.resetMessageBus = resetMessageBus;
//# sourceMappingURL=message-bus-singleton.js.map