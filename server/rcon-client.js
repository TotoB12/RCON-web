// server/rcon-client.js
const { Rcon } = require('rcon-client');

class RconClientWrapper {
  constructor() {
    this.rcon = null;
    // Bind event handlers to this instance
    this.handleError = this._handleError.bind(this);
    this.handleEnd = this._handleEnd.bind(this);
  }

  _handleError(err) {
    console.error(`RCON connection error: ${err.message}`, err);
    // Attempt a clean disconnect if possible, but mainly prevent the crash
    this.disconnect().catch(e => console.error("Error during disconnect after error:", e)); // Disconnect asynchronously
    // Setting rcon to null ensures subsequent sendCommand calls will fail cleanly
    this.rcon = null;
  }

  _handleEnd() {
    console.log('RCON connection closed by remote server.');
    // Remove listeners if they haven't been already
    if (this.rcon) {
      this.rcon.off('error', this.handleError);
      this.rcon.off('end', this.handleEnd);
    }
    // Setting rcon to null ensures subsequent sendCommand calls will fail cleanly
    this.rcon = null;
  }

  async connect(ip, port, password) {
    if (this.rcon) {
      await this.disconnect(); // Ensure cleanup before new connection
    }
    try {
      console.log(`Attempting to connect RCON to ${ip}:${port}`);
      this.rcon = await Rcon.connect({
        host: ip,
        port: port,
        password: password,
        timeout: 5000 // Optional timeout in milliseconds
      });
      console.log(`RCON connection established to ${ip}:${port}`);

      // --- Add Event Listeners ---
      this.rcon.on('error', this.handleError);
      this.rcon.on('end', this.handleEnd);
      // --------------------------

    } catch (err) {
      console.error(`RCON connection failed for ${ip}:${port}: ${err.message}`);
      this.rcon = null; // Ensure rcon is null on failed connection
      throw err; // Re-throw the error to be handled by server.js
    }
  }

  async sendCommand(command) {
    // Check if connection is still valid (might have been closed by 'error' or 'end' handlers)
    if (!this.rcon) {
      throw new Error('Not connected to RCON server (connection may have been lost)');
    }
    try {
      const response = await this.rcon.send(command);
      return response;
    } catch (err) {
       // Check if the error is due to the connection being closed
       if (!this.rcon || err.message.includes('Not connected') || err.code === 'ECONNRESET' || err.message.includes('closed')) {
         throw new Error('RCON connection lost before/during command send.');
       }
      // Log the specific send error for debugging
      console.error(`Error sending RCON command: ${err.message}`);
      throw err; // Re-throw to be handled by server.js
    }
  }

  async disconnect() {
    if (this.rcon) {
      const rconInstance = this.rcon; // Keep a reference
      this.rcon = null; // Set to null immediately to prevent race conditions

      // --- Remove Event Listeners ---
      rconInstance.off('error', this.handleError);
      rconInstance.off('end', this.handleEnd);
      // --------------------------

      try {
        console.log('Disconnecting RCON...');
        await rconInstance.end();
        console.log('RCON disconnected successfully.');
      } catch (err) {
        // Log disconnect error but don't crash
        console.error(`Error during RCON disconnect: ${err.message}`);
      }
    }
  }
}

module.exports = RconClientWrapper;