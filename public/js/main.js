// public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const serverIpInput = document.getElementById('serverIp');
    const serverPortInput = document.getElementById('serverPort');
    const serverPasswordInput = document.getElementById('serverPassword');
    const autoconnectInput = document.getElementById('autoconnect');
    const toggleConnectionBtn = document.getElementById('toggleConnectionBtn');
    const resetBtn = document.getElementById('resetBtn');
    const commandInput = document.getElementById('commandInput');
    const sendBtn = document.getElementById('sendBtn');
    const consoleOutput = document.getElementById('consoleOutput');
    const connectionStatus = document.getElementById('connectionStatus');
    const statusIndicator = connectionStatus.querySelector('.status-indicator');
    const statusText = connectionStatus.querySelector('.status-text');
  
    // Socket.io connection
    const socket = io();
  
    // Connection state
    let isConnected = false;
    let activeSettings = null; // The settings used in the current connection
  
    // Command history variables
    let commandHistory = [];
    let historyIndex = 0;
  
    // Load settings from localStorage
    loadSettings();
  
    // Attempt autoconnect if enabled and valid settings exist
    if (
      autoconnectInput.checked &&
      serverIpInput.value.trim() &&
      serverPortInput.value.trim() &&
      serverPasswordInput.value
    ) {
      connectToRcon();
    }
  
    // Attach input event listeners to update localStorage and update the connection button text
    serverIpInput.addEventListener('input', updateSettings);
    serverPortInput.addEventListener('input', updateSettings);
    serverPasswordInput.addEventListener('input', updateSettings);
    autoconnectInput.addEventListener('change', updateSettings);
  
    // Event Listeners
    settingsBtn.addEventListener('click', toggleSettingsPanel);
    toggleConnectionBtn.addEventListener('click', toggleConnection);
    resetBtn.addEventListener('click', resetApp);
    sendBtn.addEventListener('click', sendCommand);
    commandInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendCommand();
    });
  
    // Command history navigation using arrow keys
    commandInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        if (commandHistory.length > 0 && historyIndex > 0) {
          historyIndex--;
          commandInput.value = commandHistory[historyIndex];
        }
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
          historyIndex++;
          commandInput.value = commandHistory[historyIndex];
        } else {
          historyIndex = commandHistory.length;
          commandInput.value = '';
        }
        e.preventDefault();
      }
    });
  
    // Socket event handlers
    socket.on('connection-status', handleConnectionStatus);
    socket.on('command-response', handleCommandResponse);
  
    // Toggle settings panel visibility
    function toggleSettingsPanel() {
      settingsPanel.classList.toggle('hidden');
    }
  
    // Update settings in localStorage and adjust the connection button text
    function updateSettings() {
      const ip = serverIpInput.value.trim();
      const port = serverPortInput.value.trim();
      const password = serverPasswordInput.value;
      const autoconnect = autoconnectInput.checked;
  
      localStorage.setItem('rcon-web-ip', ip);
      localStorage.setItem('rcon-web-port', port);
      localStorage.setItem('rcon-web-password', password);
      localStorage.setItem('rcon-web-autoconnect', autoconnect);
  
      updateToggleButtonText();
    }
  
    // Update the text of the connection button based on current state and settings
    function updateToggleButtonText() {
      if (isConnected) {
        toggleConnectionBtn.textContent = 'Disconnect';
      } else {
        const currentSettings = {
          ip: serverIpInput.value.trim(),
          port: serverPortInput.value.trim(),
          password: serverPasswordInput.value,
        };
        if (
          activeSettings &&
          (activeSettings.ip !== currentSettings.ip ||
            activeSettings.port !== currentSettings.port ||
            activeSettings.password !== currentSettings.password)
        ) {
          toggleConnectionBtn.textContent = 'Reconnect';
        } else {
          toggleConnectionBtn.textContent = 'Connect';
        }
      }
    }
  
    // Combined connect/disconnect button action
    function toggleConnection() {
      if (isConnected) {
        disconnectFromRcon();
      } else {
        connectToRcon();
      }
    }
  
    // Initiate connection using input settings
    function connectToRcon() {
      const ip = serverIpInput.value.trim();
      const port = parseInt(serverPortInput.value.trim());
      const password = serverPasswordInput.value;
  
      if (!ip) {
        addSystemMessage('Please enter a server IP address.');
        return;
      }
      if (!port || isNaN(port)) {
        addSystemMessage('Please enter a valid port number.');
        return;
      }
      if (!password) {
        addSystemMessage('Please enter the RCON password.');
        return;
      }
  
      addSystemMessage(`Connecting to ${ip}:${port}...`);
      socket.emit('connect-rcon', { ip, port, password });
    }
  
    // Disconnect from the RCON server
    function disconnectFromRcon() {
      if (isConnected) {
        socket.emit('disconnect-rcon');
        addSystemMessage('Disconnecting from RCON server...');
      }
    }
  
    // Send a command to the server and add it to history
    function sendCommand() {
      if (!isConnected) {
        addSystemMessage('Not connected to an RCON server.');
        return;
      }
      const command = commandInput.value.trim();
      if (!command) return;
      
      // Add command to history (limit to last 100 commands)
      commandHistory.push(command);
      if (commandHistory.length > 100) {
        commandHistory.shift();
      }
      historyIndex = commandHistory.length;
      
      addCommandToConsole(command);
      socket.emit('send-command', command);
      commandInput.value = '';
    }
  
    // Handle updates to connection status
    function handleConnectionStatus(status) {
      isConnected = status.connected;
      if (status.connected) {
        activeSettings = {
          ip: serverIpInput.value.trim(),
          port: serverPortInput.value.trim(),
          password: serverPasswordInput.value,
        };
        statusIndicator.classList.remove('offline');
        statusIndicator.classList.add('online');
        statusText.textContent = 'Connected';
  
        commandInput.disabled = false;
        sendBtn.disabled = false;
        commandInput.focus();
        settingsPanel.classList.add('hidden');
      } else {
        statusIndicator.classList.remove('online');
        statusIndicator.classList.add('offline');
        statusText.textContent = 'Disconnected';
  
        commandInput.disabled = true;
        sendBtn.disabled = true;
      }
      addSystemMessage(status.message);
      updateToggleButtonText();
    }
  
    // Handle command responses from the server
    function handleCommandResponse(data) {
      if (data.success) {
        addResponseToConsole(data.response);
      } else {
        addErrorToConsole(data.response);
      }
    }
  
    // Add a command to the console output
    function addCommandToConsole(command) {
      const entry = document.createElement('div');
      entry.className = 'command-entry';
      entry.innerHTML = `<span class="command-prompt">&gt;</span> <span class="command-text">${escapeHtml(command)}</span>`;
      consoleOutput.appendChild(entry);
      scrollToBottom();
    }
  
    // Add a response message to the console output
    function addResponseToConsole(response) {
      const entry = document.createElement('div');
      entry.className = 'response-text';
      entry.textContent = response || '(No response)';
      consoleOutput.appendChild(entry);
      scrollToBottom();
    }
  
    // Add an error message to the console output
    function addErrorToConsole(errorMessage) {
      const entry = document.createElement('div');
      entry.className = 'error-text';
      entry.textContent = errorMessage;
      consoleOutput.appendChild(entry);
      scrollToBottom();
    }
  
    // Add a system message to the console output
    function addSystemMessage(message) {
      const entry = document.createElement('div');
      entry.className = 'system-message';
      entry.textContent = message;
      consoleOutput.appendChild(entry);
      scrollToBottom();
    }
  
    // Scroll the console to the bottom
    function scrollToBottom() {
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }
  
    // Load saved settings from localStorage
    function loadSettings() {
      const savedIp = localStorage.getItem('rcon-web-ip') || '';
      const savedPort = localStorage.getItem('rcon-web-port') || '';
      const savedPassword = localStorage.getItem('rcon-web-password') || '';
      const savedAutoconnect = localStorage.getItem('rcon-web-autoconnect') === 'true';
  
      serverIpInput.value = savedIp;
      serverPortInput.value = savedPort;
      serverPasswordInput.value = savedPassword;
      autoconnectInput.checked = savedAutoconnect;
  
      addSystemMessage('Welcome to RCON-Web. Click the gear icon to configure connection settings.');
      updateToggleButtonText();
    }
  
    // Reset the app: clear settings, logs, and input fields
    function resetApp() {
      if (confirm('Are you sure you want to reset all settings and logs?')) {
        localStorage.removeItem('rcon-web-ip');
        localStorage.removeItem('rcon-web-port');
        localStorage.removeItem('rcon-web-password');
        localStorage.removeItem('rcon-web-autoconnect');
  
        serverIpInput.value = '';
        serverPortInput.value = '';
        serverPasswordInput.value = '';
        autoconnectInput.checked = false;
  
        consoleOutput.innerHTML = '';
  
        activeSettings = null;
        isConnected = false;
        updateToggleButtonText();
  
        addSystemMessage('Settings and logs have been reset.');
      }
    }
  
    // Simple HTML escape to prevent injection issues
    function escapeHtml(unsafe) {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
});
