# Google Maps Geocoding MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that provides access to Google Maps Geocoding API. This server enables LLM clients like Claude Desktop and Cursor to perform address geocoding, reverse geocoding, and place ID lookups.

## Features

- 🗺️ **Forward Geocoding**: Convert addresses to coordinates
- 📍 **Reverse Geocoding**: Convert coordinates to addresses
- 🏢 **Place Geocoding**: Convert Google Place IDs to addresses
- 🌍 **Multi-language Support**: Get results in different languages
- 🎯 **Advanced Filtering**: Filter by result types, location types, and components
- 🔒 **Type Safety**: Full TypeScript support leveraging official Google Maps Services types
- 🚀 **Built on Official SDK**: Uses Google's official [`@googlemaps/google-maps-services-js`](https://github.com/googlemaps/google-maps-services-js) library

## Prerequisites

1. **Google Maps API Key**: Get one from the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials)
2. **Node.js**: Version 22 or higher
3. **pnpm**: For package management

## Installation

### For Development

```bash
# Clone the repository
git clone https://github.com/kevinwuhoo/google-maps-geocoding-mcp.git
cd google-maps-geocoding-mcp

# Install dependencies
pnpm install

# Copy environment template
cp env.example .env

# Edit .env and add your Google Maps API key
nano .env
```

### For Production Use

```bash
# Use directly with npx (recommended)
npx google-maps-geocoding-mcp

# Or install globally
npm install -g google-maps-geocoding-mcp

# Then run
google-maps-geocoding-mcp
```

## Configuration

Create a `.env` file in the project root:

```bash
# Required
GOOGLE_MAPS_API_KEY=your_api_key_here

# Optional
TIMEOUT=5000              # Request timeout in milliseconds
RATE_LIMIT=10            # Requests per second limit
DEFAULT_LANGUAGE=en      # Default language for results
DEFAULT_REGION=us        # Default region bias
```

## Setup Instructions

### Claude Desktop

1. **Install the server** (development mode):

   ```bash
   cd /path/to/google-maps-geocoding-mcp
   pnpm install
   pnpm build
   ```

2. **Configure Claude Desktop** by editing your config file:

   **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

   ```json
   {
     "mcpServers": {
       "google-maps-geocoding": {
         "command": "node",
         "args": ["/path/to/google-maps-geocoding-mcp/dist/index.js"],
         "env": {
           "GOOGLE_MAPS_API_KEY": "your_api_key_here"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop** to load the new server.

4. **Verify installation** by asking Claude:
   > "Can you geocode the address '1600 Amphitheatre Parkway, Mountain View, CA'?"

### Cursor

1. **Install the server** (same as above):

   ```bash
   cd /path/to/google-maps-geocoding-mcp
   pnpm install
   pnpm build
   ```

2. **Configure Cursor** by adding to your workspace settings or global settings:

   In VS Code/Cursor, go to Settings → Extensions → MCP Servers, or edit `settings.json`:

   ```json
   {
     "mcp.servers": [
       {
         "name": "google-maps-geocoding",
         "command": "node",
         "args": ["/path/to/google-maps-geocoding-mcp/dist/index.js"],
         "env": {
           "GOOGLE_MAPS_API_KEY": "your_api_key_here"
         }
       }
     ]
   }
   ```

3. **Restart Cursor** and check that the MCP server is loaded.

4. **Test the integration** using the AI chat in Cursor.

## Usage Examples

### Forward Geocoding (Address → Coordinates)

```typescript
// Ask Claude or Cursor:
"Geocode the address '1600 Amphitheatre Parkway, Mountain View, CA'"

// The geocode_forward tool will be called with:
{
  "address": "1600 Amphitheatre Parkway, Mountain View, CA"
}
```

### Reverse Geocoding (Coordinates → Address)

```typescript
// Ask Claude or Cursor:
"What address is at coordinates 37.4224764, -122.0842499?"

// The geocode_reverse tool will be called with:
{
  "latlng": "37.4224764,-122.0842499"
}
```

### Place Geocoding (Place ID → Address)

```typescript
// Ask Claude or Cursor:
"Get the address for Google Place ID 'ChIJd8BlQ2BZwokRAFUEcm_qrcA'"

// The geocode_place tool will be called with:
{
  "place_id": "ChIJd8BlQ2BZwokRAFUEcm_qrcA"
}
```

### Advanced Usage with Filtering

```typescript
// Component filtering (geocode_forward)
{
  "address": "Main Street",
  "components": {
    "country": "US",
    "locality": "San Francisco"
  }
}

// Language and region (geocode_forward)
{
  "address": "Champs-Élysées",
  "language": "fr",
  "region": "fr"
}

// Bounds biasing (geocode_forward)
{
  "address": "restaurants near me",
  "bounds": {
    "northeast": { "lat": 37.7849, "lng": -122.3971 },
    "southwest": { "lat": 37.7549, "lng": -122.4271 }
  }
}
```

## API Reference

The server provides three focused MCP tools, each with clear, simple parameter schemas:

### Tool: `geocode_forward`

Convert an address to geographic coordinates.

#### Parameters

| Parameter       | Type       | Required | Description                                      |
| --------------- | ---------- | -------- | ------------------------------------------------ |
| `address`       | `string`   | ✅       | Address to geocode                               |
| `components`    | `object`   | ❌       | Component filtering (country, postal_code, etc.) |
| `bounds`        | `object`   | ❌       | Viewport bounds for biasing                      |
| `language`      | `string`   | ❌       | Language code (e.g., "en", "fr")                 |
| `region`        | `string`   | ❌       | Region bias (e.g., "us", "uk")                   |
| `result_type`   | `string[]` | ❌       | Filter by result types                           |
| `location_type` | `string[]` | ❌       | Filter by location types                         |

### Tool: `geocode_reverse`

Convert geographic coordinates to a human-readable address.

#### Parameters

| Parameter       | Type       | Required | Description                      |
| --------------- | ---------- | -------- | -------------------------------- |
| `latlng`        | `string`   | ✅       | Coordinates as "lat,lng"         |
| `language`      | `string`   | ❌       | Language code (e.g., "en", "fr") |
| `region`        | `string`   | ❌       | Region bias (e.g., "us", "uk")   |
| `result_type`   | `string[]` | ❌       | Filter by result types           |
| `location_type` | `string[]` | ❌       | Filter by location types         |

### Tool: `geocode_place`

Convert a Google Place ID to a human-readable address.

#### Parameters

| Parameter       | Type       | Required | Description                      |
| --------------- | ---------- | -------- | -------------------------------- |
| `place_id`      | `string`   | ✅       | Google Place ID                  |
| `language`      | `string`   | ❌       | Language code (e.g., "en", "fr") |
| `region`        | `string`   | ❌       | Region bias (e.g., "us", "uk")   |
| `result_type`   | `string[]` | ❌       | Filter by result types           |
| `location_type` | `string[]` | ❌       | Filter by location types         |

#### Response Format

All tools return the standard Google Geocoding API response directly:

```typescript
{
  "status": "OK",
  "results": [
    {
      "formatted_address": "1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA",
      "geometry": {
        "location": {
          "lat": 37.4224764,
          "lng": -122.0842499
        },
        "location_type": "ROOFTOP"
      },
      "place_id": "ChIJtYuu0V25j4ARwu5e4wwRYgE",
      "types": ["street_address"]
    }
  ],
  "error_message": "Optional error message if status is not OK"
}
```

## Local Development Setup

### Prerequisites

- Node.js 18+ installed
- pnpm package manager (`npm install -g pnpm`)
- Google Maps API key with Geocoding API enabled

### Initial Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd google-maps-geocoding-mcp
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Configure environment**

   ```bash
   cp env.example .env
   # Edit .env and add your GOOGLE_MAPS_API_KEY
   ```

4. **Build the project**
   ```bash
   pnpm build
   ```

### Development Workflow

#### Running the Server

```bash
# Development mode with hot reload
pnpm dev

# Production mode
pnpm start

# Build TypeScript
pnpm build
```

#### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Test with UI
pnpm test:ui

# Test with coverage
pnpm test:coverage
```

#### Type Checking

```bash
# Check types
pnpm type-check

# Check types in watch mode
pnpm type-check:watch
```

#### Linting

```bash
# Run ESLint
pnpm lint

# Fix auto-fixable issues
pnpm lint:fix
```

### Project Structure

```
google-maps-geocoding-mcp/
├── src/
│   ├── index.ts          # MCP server setup and tool registration
│   ├── geocoding-tool.ts # Core geocoding logic and type definitions
│   └── config.ts         # Environment configuration
├── dist/                 # Compiled JavaScript output
├── .cursorrules          # Cursor AI development guidelines
├── .env                  # Local environment variables (create from .env.example)
├── .env.example          # Example environment variables
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

### Key Development Principles

This project follows specific development principles to maintain code quality and simplicity:

1. **Leverage the Official Library**: We maximize use of `@googlemaps/google-maps-services-js` types and avoid duplicating what the library provides.

2. **Type Derivation**: Instead of creating custom types from scratch, we derive from library types using TypeScript utilities:

   ```typescript
   // Example: Override specific fields while inheriting others
   export type ForwardGeocodeParams = Omit<
     GeocodeRequest["params"],
     "key" | "language"
   > & {
     language?: string; // Simplified from Language enum
   };
   ```

3. **Direct API Responses**: Return Google API responses directly without wrapper objects or metadata.

4. **Tool Granularity**: Each geocoding mode is a separate tool for better LLM understanding.

### Making Changes

When modifying the codebase:

1. **Adding Parameters**: Check if the Google Maps library already supports it. Derive types from the library and override only for MCP compatibility.

2. **Modifying Tools**: Keep tool schemas flat and simple. Each tool should have a single, clear purpose.

3. **Error Handling**: Always return errors through the API (fail-fast) rather than suppressing them.

4. **Type Safety**: Let TypeScript enforce correctness. Don't bypass the type system.

### Common Development Tasks

#### Adding a New Parameter

1. Check the `@googlemaps/google-maps-services-js` library for the parameter
2. Update the appropriate params type in `src/geocoding-tool.ts` using type derivation
3. Add validation if needed in the validate methods
4. Update the tool schema in `src/index.ts`
5. Update this README with the new parameter

#### Testing Your Changes

```bash
# Quick test a single tool
node -e "
  const { GeocodingTool } = require('./dist/geocoding-tool.js');
  const { loadConfig } = require('./dist/config.js');
  const tool = new GeocodingTool(loadConfig());
  tool.geocodeForward({ address: 'New York' })
    .then(console.log)
    .catch(console.error);
"
```

#### Updating Dependencies

```bash
# Update all dependencies
pnpm update

# Update a specific dependency
pnpm update @googlemaps/google-maps-services-js

# Check for outdated packages
pnpm outdated
```

### Publishing to npm

```bash
# Ensure clean build
pnpm clean && pnpm build

# Test the package locally
pnpm pack

# Dry run to see what will be published
pnpm publish --dry-run

# Publish (requires npm login)
pnpm publish
```

## Error Handling

The server provides comprehensive error handling for:

- ❌ **Invalid API keys**
- ❌ **Rate limiting** (429 responses)
- ❌ **Network errors**
- ❌ **Invalid parameter combinations**
- ❌ **Geographic restrictions**
- ❌ **Quota exceeded errors**

## Google Maps API Setup

1. **Enable the Geocoding API** in the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/api-list)
2. **Create an API key** in [Credentials](https://console.cloud.google.com/google/maps-apis/credentials)
3. **Restrict your API key** for security:
   - **Application restrictions**: HTTP referrers or IP addresses
   - **API restrictions**: Only Geocoding API
4. **Monitor usage** in the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/quotas)

## Troubleshooting

### Common Issues

**MCP Server not connecting:**

- Verify the path to `dist/index.js` is correct
- Check that Node.js version is 18+
- Ensure the server was built with `pnpm build`

**API key errors:**

- Verify the API key in your `.env` file or MCP config
- Check that the Geocoding API is enabled in Google Cloud Console
- Ensure API key restrictions allow your usage

**Rate limiting:**

- Reduce the `RATE_LIMIT` environment variable
- Monitor your API usage in Google Cloud Console
- Consider caching frequent requests

### Debug Mode

Enable debug logging by setting:

```bash
LOG_LEVEL=debug
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/) - The protocol this server implements
- [Google Maps Services JS](https://github.com/googlemaps/google-maps-services-js) - Official Google Maps API client
- [Claude Desktop](https://claude.ai/desktop) - AI assistant that supports MCP
- [Cursor](https://cursor.sh/) - AI-powered code editor

## Support

- 📖 [Google Maps Platform Documentation](https://developers.google.com/maps/documentation/geocoding/overview)
- 💬 [MCP Community Discord](https://discord.gg/mcp)
- 🐛 [Issue Tracker](https://github.com/kevinwuhoo/google-maps-geocoding-mcp/issues)
- 📧 [Google Maps Support](https://developers.google.com/maps/support)
