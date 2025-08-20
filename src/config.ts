/**
 * Configuration for the MCP server
 */
export interface ServerConfig {
  /** Google Maps API key */
  apiKey: string;
  /** Default timeout for requests (ms) */
  timeout?: number;
  /** Rate limiting (requests per second) */
  rateLimit?: number;
  /** Default language for responses */
  defaultLanguage?: string;
  /** Default region for responses */
  defaultRegion?: string | undefined;
}

/**
 * Load and validate server configuration from environment variables
 */
export function loadConfig(): ServerConfig {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GOOGLE_MAPS_API_KEY environment variable is required. " +
        "Please set it to your Google Maps API key."
    );
  }

  const config: ServerConfig = {
    apiKey,
    timeout: process.env.TIMEOUT ? parseInt(process.env.TIMEOUT, 10) : 5000,
    rateLimit: process.env.RATE_LIMIT
      ? parseInt(process.env.RATE_LIMIT, 10)
      : 10,
    defaultLanguage: process.env.DEFAULT_LANGUAGE || "en",
    defaultRegion: process.env.DEFAULT_REGION,
  };

  // Validate configuration
  if (config.timeout && (config.timeout < 1000 || config.timeout > 30000)) {
    throw new Error("TIMEOUT must be between 1000 and 30000 milliseconds");
  }

  if (config.rateLimit && (config.rateLimit < 1 || config.rateLimit > 100)) {
    throw new Error("RATE_LIMIT must be between 1 and 100 requests per second");
  }

  return config;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Partial<ServerConfig> = {
  timeout: 5000,
  rateLimit: 10,
  defaultLanguage: "en",
};
