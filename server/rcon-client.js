// server/rcon-client.js
const { Rcon } = require('rcon-client');

class RconClientWrapper {
  constructor() {
    this.rcon = null;
  }

  async connect(ip, port, password) {
    if (this.rcon) {
      await this.disconnect();
    }
    try {
      // Connect using the dedicated rcon-client package
      this.rcon = await Rcon.connect({
        host: ip,
        port: port,
        password: password,
        timeout: 5000 // Optional timeout in milliseconds
      });
    } catch (err) {
      this.rcon = null;
      throw err;
    }
  }

  async sendCommand(command) {
    if (!this.rcon) {
      throw new Error('Not connected to RCON server');
    }
    try {
      const response = await this.rcon.send(command);
      return response;
    } catch (err) {
      throw err;
    }
  }

  async disconnect() {
    if (this.rcon) {
      await this.rcon.end();
      this.rcon = null;
    }
  }
}

module.exports = RconClientWrapper;
