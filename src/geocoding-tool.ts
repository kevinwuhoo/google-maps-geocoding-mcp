import {
  Client,
  GeocodeResponse,
  GeocodeComponents,
  ReverseGeocodingLocationType,
} from "@googlemaps/google-maps-services-js";
import {
  AddressType,
  LatLngBounds,
} from "@googlemaps/google-maps-services-js/dist/common";
import { ServerConfig } from "./config.js";

// MCP-specific types (minimal wrapper for routing)
export type GeocodeMode = "forward" | "reverse" | "place";

// Common optional parameters for all modes
interface BaseGeocodeParams {
  language?: string;
  region?: string;
  result_type?: AddressType[];
  location_type?: ReverseGeocodingLocationType[];
}

// Discriminated union for MCP routing
export type GeocodeParams = BaseGeocodeParams &
  (
    | {
        mode: "forward";
        address: string;
        components?: GeocodeComponents;
        bounds?: LatLngBounds;
      }
    | { mode: "reverse"; latlng: string }
    | { mode: "place"; place_id: string }
  );

// Export specific types for backwards compatibility
export type ForwardGeocodeParams = Extract<GeocodeParams, { mode: "forward" }>;
export type ReverseGeocodeParams = Extract<GeocodeParams, { mode: "reverse" }>;
export type PlaceGeocodeParams = Extract<GeocodeParams, { mode: "place" }>;

export interface GeocodeToolResponse {
  status: string;
  results: GeocodeResponse["data"]["results"];
  metadata: {
    mode: GeocodeMode;
    request_params: Record<string, any>;
    timestamp: string;
    api_version: string;
  };
  error_message?: string;
}

// Type guards (simplified with discriminated union)
const isForwardGeocodeParams = (p: GeocodeParams): p is ForwardGeocodeParams =>
  p.mode === "forward";

const isReverseGeocodeParams = (p: GeocodeParams): p is ReverseGeocodeParams =>
  p.mode === "reverse";

const isPlaceGeocodeParams = (p: GeocodeParams): p is PlaceGeocodeParams =>
  p.mode === "place";

/**
 * Google Maps Geocoding API client wrapper
 */
export class GeocodingTool {
  private client: Client;
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
    this.client = new Client({});
  }

  /**
   * Execute geocoding based on the provided parameters
   */
  async geocode(params: GeocodeParams): Promise<GeocodeToolResponse> {
    try {
      // Validate parameters
      this.validateParams(params);

      let response;
      let requestParams: Record<string, any>;

      if (isForwardGeocodeParams(params)) {
        const result = await this.forwardGeocode(params);
        response = result.response;
        requestParams = result.requestParams;
      } else if (isReverseGeocodeParams(params)) {
        const result = await this.reverseGeocode(params);
        response = result.response;
        requestParams = result.requestParams;
      } else if (isPlaceGeocodeParams(params)) {
        const result = await this.placeGeocode(params);
        response = result.response;
        requestParams = result.requestParams;
      } else {
        throw new Error(
          'Invalid geocoding mode. Must be "forward", "reverse", or "place".'
        );
      }

      return {
        status: response.data.status,
        results: response.data.results || [],
        metadata: {
          mode: params.mode,
          request_params: requestParams,
          timestamp: new Date().toISOString(),
          api_version: "3.4.2",
        },
        error_message: response.data.error_message,
      };
    } catch (error: any) {
      // Handle API errors gracefully
      if (error.response?.data) {
        return {
          status: error.response.data.status || "ERROR",
          results: [],
          metadata: {
            mode: params.mode,
            request_params: {},
            timestamp: new Date().toISOString(),
            api_version: "3.4.2",
          },
          error_message: error.response.data.error_message || error.message,
        };
      }

      throw error;
    }
  }

  /**
   * Forward geocoding (address to coordinates)
   */
  private async forwardGeocode(params: ForwardGeocodeParams) {
    const requestParams: any = {
      address: params.address,
      key: this.config.apiKey,
      language: params.language || this.config.defaultLanguage,
    };

    // Add optional parameters
    if (params.region || this.config.defaultRegion) {
      requestParams.region = params.region || this.config.defaultRegion;
    }

    if (params.components) {
      requestParams.components = params.components;
    }

    if (params.bounds) {
      requestParams.bounds = params.bounds;
    }

    if (params.result_type) {
      requestParams.result_type = params.result_type;
    }

    if (params.location_type) {
      requestParams.location_type = params.location_type;
    }

    const response = await this.client.geocode({
      params: requestParams,
      timeout: this.config.timeout || 5000,
    });

    return { response, requestParams };
  }

  /**
   * Reverse geocoding (coordinates to address)
   */
  private async reverseGeocode(params: ReverseGeocodeParams) {
    const requestParams: any = {
      latlng: params.latlng,
      key: this.config.apiKey,
      language: params.language || this.config.defaultLanguage,
    };

    // Add optional parameters
    if (params.region || this.config.defaultRegion) {
      requestParams.region = params.region || this.config.defaultRegion;
    }

    if (params.result_type) {
      requestParams.result_type = params.result_type;
    }

    if (params.location_type) {
      requestParams.location_type = params.location_type;
    }

    const response = await this.client.reverseGeocode({
      params: requestParams,
      timeout: this.config.timeout || 5000,
    });

    return { response, requestParams };
  }

  /**
   * Place geocoding (Place ID to address)
   */
  private async placeGeocode(params: PlaceGeocodeParams) {
    const requestParams: any = {
      place_id: params.place_id,
      key: this.config.apiKey,
      language: params.language || this.config.defaultLanguage,
    };

    // Add optional parameters
    if (params.region || this.config.defaultRegion) {
      requestParams.region = params.region || this.config.defaultRegion;
    }

    if (params.result_type) {
      requestParams.result_type = params.result_type;
    }

    if (params.location_type) {
      requestParams.location_type = params.location_type;
    }

    const response = await this.client.reverseGeocode({
      params: requestParams,
      timeout: this.config.timeout || 5000,
    });

    return { response, requestParams };
  }

  /**
   * Validate geocoding parameters
   */
  private validateParams(params: GeocodeParams): void {
    if (!params.mode) {
      throw new Error(
        'Mode is required. Must be "forward", "reverse", or "place".'
      );
    }

    if (isForwardGeocodeParams(params)) {
      if (!params.address || params.address.trim().length === 0) {
        throw new Error("Address is required for forward geocoding.");
      }
      if (params.address.length > 2048) {
        throw new Error("Address must be less than 2048 characters.");
      }
    }

    if (isReverseGeocodeParams(params)) {
      if (!params.latlng) {
        throw new Error("Latlng is required for reverse geocoding.");
      }
      if (!this.isValidLatLng(params.latlng)) {
        throw new Error(
          'Invalid latlng format. Expected: "latitude,longitude"'
        );
      }
    }

    if (isPlaceGeocodeParams(params)) {
      if (!params.place_id) {
        throw new Error("Place ID is required for place geocoding.");
      }
      if (!params.place_id.startsWith("ChIJ")) {
        throw new Error('Invalid Place ID format. Must start with "ChIJ".');
      }
    }

    // Validate optional parameters
    if (params.language && !/^[a-z]{2}(-[A-Z]{2})?$/.test(params.language)) {
      throw new Error('Invalid language format. Expected: "en", "en-US", etc.');
    }

    if (params.region && !/^[a-z]{2}$/.test(params.region)) {
      throw new Error('Invalid region format. Expected: "us", "uk", etc.');
    }
  }

  /**
   * Validate latitude,longitude format
   */
  private isValidLatLng(latlng: string): boolean {
    const parts = latlng.split(",");
    if (parts.length !== 2) return false;

    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());

    return (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }
}
