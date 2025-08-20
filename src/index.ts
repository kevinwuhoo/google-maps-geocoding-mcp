#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GeocodingTool, GeocodeParams } from "./geocoding-tool.js";
import { loadConfig } from "./config.js";

/**
 * Main MCP server for Google Maps Geocoding API
 */
async function main() {
  // Load configuration
  let config;
  try {
    config = loadConfig();
  } catch (error: any) {
    console.error("Configuration error:", error.message);
    process.exit(1);
  }

  // Initialize geocoding tool
  const geocodingTool = new GeocodingTool(config);

  // Create MCP server
  const server = new Server(
    {
      name: "google-maps-geocoding",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "geocode",
          description:
            "Geocode addresses, coordinates, or place IDs using Google Maps API. Supports forward geocoding (address to coordinates), reverse geocoding (coordinates to address), and place geocoding (Place ID to address).",
          inputSchema: {
            type: "object",
            properties: {
              mode: {
                type: "string",
                enum: ["forward", "reverse", "place"],
                description:
                  'Geocoding mode: "forward" (address to coordinates), "reverse" (coordinates to address), or "place" (Place ID to address)',
              },
              address: {
                type: "string",
                description:
                  'Address to geocode (required for forward mode). Example: "1600 Amphitheatre Parkway, Mountain View, CA"',
              },
              latlng: {
                type: "string",
                description:
                  'Latitude,longitude coordinates (required for reverse mode). Example: "40.714224,-73.961452"',
              },
              place_id: {
                type: "string",
                description:
                  'Google Place ID (required for place mode). Example: "ChIJd8BlQ2BZwokRAFUEcm_qrcA"',
              },
              components: {
                type: "object",
                description:
                  "Component filtering for forward geocoding (optional)",
                properties: {
                  country: {
                    type: "string",
                    description: 'Country code (e.g., "US")',
                  },
                  postal_code: { type: "string", description: "Postal code" },
                  route: { type: "string", description: "Route name" },
                  locality: { type: "string", description: "City name" },
                  administrative_area: {
                    type: "string",
                    description: "State/province",
                  },
                },
              },
              bounds: {
                type: "object",
                description: "Viewport bounds for biasing results (optional)",
                properties: {
                  northeast: {
                    type: "object",
                    properties: {
                      lat: { type: "number" },
                      lng: { type: "number" },
                    },
                    required: ["lat", "lng"],
                  },
                  southwest: {
                    type: "object",
                    properties: {
                      lat: { type: "number" },
                      lng: { type: "number" },
                    },
                    required: ["lat", "lng"],
                  },
                },
                required: ["northeast", "southwest"],
              },
              language: {
                type: "string",
                description:
                  'Language for results (optional). Example: "en", "es", "fr"',
              },
              region: {
                type: "string",
                description:
                  'Region bias using ccTLD format (optional). Example: "us", "uk", "au"',
              },
              result_type: {
                type: "array",
                items: { type: "string" },
                description:
                  'Filter results by type (optional). Examples: ["street_address"], ["political"]',
              },
              location_type: {
                type: "array",
                items: { type: "string" },
                description:
                  'Filter by location precision (optional). Examples: ["ROOFTOP"], ["RANGE_INTERPOLATED"]',
              },
            },
            required: ["mode"],
            oneOf: [
              {
                properties: { mode: { const: "forward" } },
                required: ["mode", "address"],
              },
              {
                properties: { mode: { const: "reverse" } },
                required: ["mode", "latlng"],
              },
              {
                properties: { mode: { const: "place" } },
                required: ["mode", "place_id"],
              },
            ],
          },
        },
      ],
    };
  });

  // Handle tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "geocode") {
      try {
        const params = args as unknown as GeocodeParams;
        const result = await geocodingTool.geocode(params);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Graceful shutdown
  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await server.close();
    process.exit(0);
  });
}

// Handle errors
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
