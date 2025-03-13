// server/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const RconClient = require('./rcon-client'); // now using the dedicated package wrapper

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('New client connected');

  // Create a new RCON client for this connection
  const rconClient = new RconClient();

  // Handle connect request
  socket.on('connect-rcon', async (config) => {
    try {
      await rconClient.connect(config.ip, config.port, config.password);
      socket.emit('connection-status', {
        connected: true,
        message: 'Connected to RCON server successfully'
      });
    } catch (error) {
      socket.emit('connection-status', {
        connected: false,
        message: `Connection failed: ${error.message}`
      });
    }
  });

  // Handle command request
  socket.on('send-command', async (command) => {
    try {
      const response = await rconClient.sendCommand(command);
      socket.emit('command-response', {
        success: true,
        command,
        response
      });
    } catch (error) {
      socket.emit('command-response', {
        success: false,
        command,
        response: `Error: ${error.message}`
      });
    }
  });

  // Handle disconnect request
  socket.on('disconnect-rcon', async () => {
    try {
      await rconClient.disconnect();
      socket.emit('connection-status', {
        connected: false,
        message: 'Disconnected from RCON server'
      });
    } catch (error) {
      console.error('Error disconnecting RCON:', error.message);
    }
  });

  // Handle client disconnect
  socket.on('disconnect', async () => {
    console.log('Client disconnected');
    try {
      await rconClient.disconnect();
    } catch (error) {
      console.error('Error disconnecting RCON:', error.message);
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`RCON-Web server running on port ${PORT}`);
});
