# Contributing to Google Maps Geocoding MCP Server

Thank you for your interest in contributing! This guide covers everything you need to know about developing and contributing to this project.

## Local Development Setup

### Prerequisites

- Node.js 18+ installed
- pnpm package manager (`npm install -g pnpm`)
- Google Maps API key with Geocoding API enabled

### Initial Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/kevinwuhoo/google-maps-geocoding-mcp.git
   cd google-maps-geocoding-mcp
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Build the project**
   ```bash
   pnpm build
   ```

## Development Workflow

Since MCP servers maintain persistent connections with clients, the recommended development cycle is:

1. **Start continuous build**: `pnpm build:watch` (in one terminal)
2. **Make changes** to your TypeScript source (files auto-rebuild)
3. **Restart your MCP client** (Claude Desktop/Cursor) to reconnect with fresh build

```bash
# Recommended: Start continuous building (leave this running)
pnpm build:watch

# In another terminal: Run tests as you develop
pnpm test

# One-time build (if you prefer manual builds)
pnpm build

# Test the built server directly (optional - mainly for debugging)
# Note: This will start the server but it waits for MCP protocol input
GOOGLE_MAPS_API_KEY=your_key node dist/index.js
```

### Testing

```bash
# Run tests in watch mode (default)
pnpm test

# Run tests once (no watch)
pnpm test:run

# Test with UI
pnpm test:ui

# Test with coverage
pnpm test:coverage
```

### Type Checking

```bash
# Check types
pnpm type-check

# Check types in watch mode
pnpm type-check:watch
```

### Linting

```bash
# Run ESLint
pnpm lint

# Fix auto-fixable issues
pnpm lint:fix
```

## Key Development Principles

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

## Publishing

### Publishing Process

```bash
# Ensure clean build
pnpm clean && pnpm build

# Test the package locally
pnpm pack

# Dry run to see what will be published
pnpm publish --dry-run

# Publish
pnpm publish --access public
```
