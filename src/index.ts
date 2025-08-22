#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  GeocodingTool,
  ForwardGeocodeParams,
  ReverseGeocodeParams,
  PlaceGeocodeParams,
} from "./geocoding-tool.js";
import { loadConfig } from "./config.js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf-8"),
);
const { version } = packageJson;

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
      version: version,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "geocode_forward",
          description:
            "Convert an address to geographic coordinates (latitude/longitude) using Google Maps Geocoding API.",
          inputSchema: {
            type: "object",
            properties: {
              address: {
                type: "string",
                description:
                  'Address to geocode. Example: "1600 Amphitheatre Parkway, Mountain View, CA"',
              },
              components: {
                type: "object",
                description: "Component filtering (optional)",
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
                description: 'Language for results (e.g., "en", "es")',
              },
              region: {
                type: "string",
                description: 'Region bias (e.g., "us", "uk")',
              },
              result_type: {
                type: "array",
                items: { type: "string" },
                description:
                  'Filter by result types (e.g., ["street_address"])',
              },
              location_type: {
                type: "array",
                items: { type: "string" },
                description: 'Filter by location precision (e.g., ["ROOFTOP"])',
              },
            },
            required: ["address"],
          },
        },
        {
          name: "geocode_reverse",
          description:
            "Convert geographic coordinates (latitude/longitude) to a human-readable address using Google Maps Geocoding API.",
          inputSchema: {
            type: "object",
            properties: {
              latlng: {
                type: "string",
                description:
                  'Latitude,longitude coordinates. Example: "40.714224,-73.961452"',
              },
              language: {
                type: "string",
                description: 'Language for results (e.g., "en", "es")',
              },
              region: {
                type: "string",
                description: 'Region bias (e.g., "us", "uk")',
              },
              result_type: {
                type: "array",
                items: { type: "string" },
                description:
                  'Filter by result types (e.g., ["street_address"])',
              },
              location_type: {
                type: "array",
                items: { type: "string" },
                description: 'Filter by location precision (e.g., ["ROOFTOP"])',
              },
            },
            required: ["latlng"],
          },
        },
        {
          name: "geocode_place",
          description:
            "Convert a Google Place ID to a human-readable address using Google Maps Geocoding API.",
          inputSchema: {
            type: "object",
            properties: {
              place_id: {
                type: "string",
                description:
                  'Google Place ID. Example: "ChIJd8BlQ2BZwokRAFUEcm_qrcA"',
              },
              language: {
                type: "string",
                description: 'Language for results (e.g., "en", "es")',
              },
              region: {
                type: "string",
                description: 'Region bias (e.g., "us", "uk")',
              },
              result_type: {
                type: "array",
                items: { type: "string" },
                description:
                  'Filter by result types (e.g., ["street_address"])',
              },
              location_type: {
                type: "array",
                items: { type: "string" },
                description: 'Filter by location precision (e.g., ["ROOFTOP"])',
              },
            },
            required: ["place_id"],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result;

      switch (name) {
        case "geocode_forward":
          result = await geocodingTool.geocodeForward(
            args as unknown as ForwardGeocodeParams,
          );
          break;

        case "geocode_reverse":
          result = await geocodingTool.geocodeReverse(
            args as unknown as ReverseGeocodeParams,
          );
          break;

        case "geocode_place":
          result = await geocodingTool.geocodePlace(
            args as unknown as PlaceGeocodeParams,
          );
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

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
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log server startup
  console.error(`Google Maps Geocoding MCP Server v${version} started`);

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
