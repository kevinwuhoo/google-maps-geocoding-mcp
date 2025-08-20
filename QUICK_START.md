# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Set up API Key

```bash
# Copy the environment template
cp env.example .env

# Edit and add your Google Maps API key
nano .env
```

Add your API key:

```bash
GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 2. Build and Test

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Test the server (optional)
GOOGLE_MAPS_API_KEY=your_key node dist/index.js
```

### 3. Configure Claude Desktop

Edit your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "google-maps-geocoding": {
      "command": "node",
      "args": ["/full/path/to/google-maps-geocoding-mcp/dist/index.js"],
      "env": {
        "GOOGLE_MAPS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### 4. Restart Claude Desktop

Restart Claude Desktop to load the MCP server.

### 5. Test with Claude

Ask Claude:

> "Can you geocode the address '1600 Amphitheatre Parkway, Mountain View, CA'?"

Claude should now be able to use the geocoding tool!

## 📍 Example Queries

- **Forward Geocoding**: "What are the coordinates for Times Square, New York?"
- **Reverse Geocoding**: "What address is at coordinates 37.7749, -122.4194?"
- **Place Geocoding**: "Get address for Place ID ChIJVVVVVVVVVVVVVVVVVVVVVA"
- **With Filtering**: "Find coffee shops in San Francisco with postal code filter"

## 🔧 Troubleshooting

**Server not connecting?**

- Check the full path to `dist/index.js` in your config
- Verify Node.js version is 18+
- Ensure the project was built with `pnpm build`

**API errors?**

- Verify your Google Maps API key
- Check that Geocoding API is enabled in Google Cloud Console
- Ensure API key has proper restrictions

**Need help?**

- Check the main [README.md](README.md) for detailed documentation
- Review the [Google Maps Platform documentation](https://developers.google.com/maps/documentation/geocoding/overview)

---

🎉 **Success!** You now have a fully functional Google Maps Geocoding MCP server integrated with Claude Desktop!
