const readyEvent = require('./ready');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    await readyEvent.handleMessage(message, client);
  }
};
