# Google Maps Geocoding MCP Server

[![NPM Version](https://img.shields.io/npm/v/google-maps-geocoding-mcp?style=flat&color=blue)](https://www.npmjs.com/package/google-maps-geocoding-mcp)
[![NPM Downloads](https://img.shields.io/npm/dw/google-maps-geocoding-mcp?style=flat&color=green)](https://www.npmjs.com/package/google-maps-geocoding-mcp)
[![License](https://img.shields.io/npm/l/google-maps-geocoding-mcp?style=flat&color=blue)](https://github.com/kevinwuhoo/google-maps-geocoding-mcp/blob/main/LICENSE)
[![Node.js Version](https://img.shields.io/node/v/google-maps-geocoding-mcp?style=flat&color=green)](https://nodejs.org/)
[![GitHub Stars](https://img.shields.io/github/stars/kevinwuhoo/google-maps-geocoding-mcp?style=flat&color=yellow)](https://github.com/kevinwuhoo/google-maps-geocoding-mcp)
[![GitHub Issues](https://img.shields.io/github/issues/kevinwuhoo/google-maps-geocoding-mcp?style=flat&color=red)](https://github.com/kevinwuhoo/google-maps-geocoding-mcp/issues)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that provides access to Google Maps Geocoding API. This server enables LLM clients like Claude Desktop and Cursor to perform address geocoding, reverse geocoding, and place ID lookups. The aim of this MCP is _only_ the Geocoding API. This is because there isn't great support for connecting to many MCP servers yet in most tools.

## Features

- 🗺️ **Forward Geocoding**: Convert addresses to coordinates
- 📍 **Reverse Geocoding**: Convert coordinates to addresses
- 🏢 **Place Geocoding**: Convert Google Place IDs to addresses
- 🌍 **Multi-language Support**: Get results in different languages
- 🎯 **Advanced Filtering**: Filter by result types, location types, and components
- 🚀 **Built on Official SDK**: Uses Google's official [`@googlemaps/google-maps-services-js`](https://github.com/googlemaps/google-maps-services-js) library will full TypeScript support

## Prerequisites

1. **Google Maps API Key**: Get one from the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials)
2. **Node.js**: Version 18 or higher
3. **Claude Desktop** or **Cursor** (or another MCP-compatible client)

## Setup with MCP Clients

### Claude Desktop

Edit your Claude Desktop config file:

| Platform    | Config File Location                                              |
| ----------- | ----------------------------------------------------------------- |
| **macOS**   | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json`                     |

```json
{
  "mcpServers": {
    "google-maps-geocoding": {
      "command": "npx",
      "args": ["google-maps-geocoding-mcp"],
      "env": {
        "GOOGLE_MAPS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Then restart Claude Desktop and ask Claude to geocode an address!

### Cursor

Add to your Cursor settings (Settings → Extensions → MCP Servers):

```json
{
  "mcp.servers": [
    {
      "name": "google-maps-geocoding",
      "command": "npx",
      "args": ["google-maps-geocoding-mcp"],
      "env": {
        "GOOGLE_MAPS_API_KEY": "your_api_key_here"
      }
    }
  ]
}
```

Test the integration using the AI chat!

## Usage Examples

### Forward Geocoding (Address → Coordinates)

Ask your AI client:

> "Geocode the address '1600 Amphitheatre Parkway, Mountain View, CA'"

### Reverse Geocoding (Coordinates → Address)

Ask your AI client:

> "What address is at coordinates 37.4224764, -122.0842499?"

### Place Geocoding (Place ID → Address)

Ask your AI client:

> "Get the address for Google Place ID 'ChIJd8BlQ2BZwokRAFUEcm_qrcA'"

### Advanced Usage

**With component filtering:**

> "Find 'Main Street' in San Francisco, CA, US"

**With language preferences:**

> "Geocode 'Champs-Élysées' in French"

**With regional biasing:**

> "Find restaurants near coordinates 37.7749, -122.4194 in the US region"

### Common Issues

**MCP Server not connecting:**

- Verify Node.js version is 18+
- Check your MCP client configuration

**API key errors:**

- Verify your API key is correct
- Check that the Geocoding API is enabled in Google Cloud Console
- Ensure API key restrictions allow your usage

### Debug Mode

Enable debug logging by setting:

```bash
LOG_LEVEL=debug npx google-maps-geocoding-mcp
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, guidelines, and how to submit changes.
