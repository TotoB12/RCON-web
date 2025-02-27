# RCON-Web

A simple web interface for connecting to and managing RCON-enabled game servers.

## Features

- Clean, simple user interface
- Persistent connection settings saved in local storage
- Real-time command responses
- Support for any RCON protocol compatible server

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone or download this repository
2. Navigate to the project directory in your terminal
3. Install dependencies:

```bash
npm install
```

4. Start the server:

```bash
npm start
```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Click the gear icon in the top right to open the connection settings
2. Enter your RCON server details:
   - Server IP address
   - Port number (usually 25575 for Minecraft, may vary for other games)
   - RCON password
3. Click "Connect"
4. Once connected, you can enter commands in the input box at the bottom
5. Press Enter or click the send button to execute commands

## Security Notes

- RCON passwords are stored in local storage, which is not encrypted
- For added security, use this application on a private network or via a secure connection
- Always use strong passwords for your RCON servers

## Supported Games

This application should work with any server that implements the standard RCON protocol, including:

- Minecraft
- Counter-Strike
- Rust
- ARK: Survival Evolved
- Valheim
- And many more!

## License

MIT License