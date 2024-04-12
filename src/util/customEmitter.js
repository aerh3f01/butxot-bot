const EventEmitter = require('events');
class CustomEventEmitter extends EventEmitter {}
const customEmitter = new CustomEventEmitter();

// Export the emitter to use it in other files
module.exports = customEmitter;
