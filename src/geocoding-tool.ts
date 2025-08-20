import {
  Client,
  GeocodeResponse,
  GeocodeRequest,
  ReverseGeocodeRequest,
} from "@googlemaps/google-maps-services-js";
import { Status } from "@googlemaps/google-maps-services-js/dist/common.js";
import { ServerConfig } from "./config.js";

// Use library types but override specific fields for MCP simplicity
// This gives us type safety from the library while keeping our interface clean

export type ForwardGeocodeParams = Omit<
  GeocodeRequest["params"],
  "key" | "bounds" | "language"
> & {
  // Override bounds to always use object format for MCP simplicity
  bounds?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
  // Override language to accept any string, this is a enum in the library with
  // 100+ options, basically all the languages in the world.
  language?: string;
  // Add commonly used filters
  result_type?: string[];
  location_type?: string[];
};

export type ReverseGeocodeParams = Omit<
  ReverseGeocodeRequest["params"],
  "key" | "latlng" | "place_id" | "language" | "result_type" | "location_type"
> & {
  // Override latlng to only accept string format for MCP simplicity
  latlng: string;
  // Override language to accept any string (not Language enum)
  language?: string;
  // Add region which might not be in the base type
  region?: string;
  // Override to accept string arrays instead of enum arrays
  result_type?: string[];
  location_type?: string[];
};

export type PlaceGeocodeParams = Omit<
  ReverseGeocodeRequest["params"],
  "key" | "latlng" | "language" | "result_type" | "location_type"
> & {
  // Ensure place_id is required
  place_id: string;
  // Override language to accept any string
  language?: string;
  // Add region which might not be in the base type
  region?: string;
  // Override to accept string arrays instead of enum arrays
  result_type?: string[];
  location_type?: string[];
};

export type GeocodeToolResponse = GeocodeResponse["data"];

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
   * Forward geocoding: Convert address to coordinates
   */
  async geocodeForward(
    params: ForwardGeocodeParams,
  ): Promise<GeocodeToolResponse> {
    try {
      this.validateForwardParams(params);
      const result = await this.executeForwardGeocode(params);
      return result.response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Reverse geocoding: Convert coordinates to address
   */
  async geocodeReverse(
    params: ReverseGeocodeParams,
  ): Promise<GeocodeToolResponse> {
    try {
      this.validateReverseParams(params);
      const result = await this.executeReverseGeocode(params);
      return result.response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Place geocoding: Convert Place ID to address
   */
  async geocodePlace(params: PlaceGeocodeParams): Promise<GeocodeToolResponse> {
    try {
      this.validatePlaceParams(params);
      const result = await this.executePlaceGeocode(params);
      return result.response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  private async executeForwardGeocode(params: ForwardGeocodeParams) {
    const requestParams: any = {
      address: params.address,
      key: this.config.apiKey,
      language: params.language || this.config.defaultLanguage || undefined,
      region: params.region || this.config.defaultRegion || undefined,
      components: params.components || undefined,
      bounds: params.bounds || undefined,
      result_type: params.result_type || undefined,
      location_type: params.location_type || undefined,
    };

    // Remove undefined values to avoid issues with exactOptionalPropertyTypes
    Object.keys(requestParams).forEach(
      (key) => requestParams[key] === undefined && delete requestParams[key],
    );

    const response = await this.client.geocode({
      params: requestParams,
      timeout: this.config.timeout || 5000,
    });

    return { response, requestParams };
  }

  private async executeReverseGeocode(params: ReverseGeocodeParams) {
    const requestParams: any = {
      latlng: params.latlng, // Library accepts string format
      key: this.config.apiKey,
      language: params.language || this.config.defaultLanguage || undefined,
      result_type: params.result_type || undefined,
      location_type: params.location_type || undefined,
    };

    // Note: reverse geocoding doesn't support region parameter
    if (params.region) {
      requestParams.region = params.region;
    }

    // Remove undefined values
    Object.keys(requestParams).forEach(
      (key) => requestParams[key] === undefined && delete requestParams[key],
    );

    const response = await this.client.reverseGeocode({
      params: requestParams,
      timeout: this.config.timeout || 5000,
    });

    return { response, requestParams };
  }

  private async executePlaceGeocode(params: PlaceGeocodeParams) {
    const requestParams: any = {
      place_id: params.place_id,
      key: this.config.apiKey,
      language: params.language || this.config.defaultLanguage || undefined,
      result_type: params.result_type || undefined,
      location_type: params.location_type || undefined,
    };

    // Note: place geocoding doesn't support region parameter
    if (params.region) {
      requestParams.region = params.region;
    }

    // Remove undefined values
    Object.keys(requestParams).forEach(
      (key) => requestParams[key] === undefined && delete requestParams[key],
    );

    const response = await this.client.reverseGeocode({
      params: requestParams,
      timeout: this.config.timeout || 5000,
    });

    return { response, requestParams };
  }

  /**
   * Handle API errors consistently
   */
  private handleError(error: any): GeocodeToolResponse {
    if (error.response?.data) {
      return error.response.data;
    }
    // For non-API errors, create a response in the expected format
    return {
      status: Status.INVALID_REQUEST,
      results: [],
      error_message: error.message,
    };
  }

  private validateForwardParams(params: ForwardGeocodeParams): void {
    if (!params.address || params.address.trim().length === 0) {
      throw new Error("Address is required.");
    }
    if (params.address.length > 2048) {
      throw new Error("Address must be less than 2048 characters.");
    }
    this.validateCommonParams(params);
  }

  private validateReverseParams(params: ReverseGeocodeParams): void {
    if (!params.latlng) {
      throw new Error("Latlng is required.");
    }
    if (
      typeof params.latlng === "string" &&
      !this.isValidLatLng(params.latlng)
    ) {
      throw new Error('Invalid latlng format. Expected: "latitude,longitude"');
    }
    this.validateCommonParams(params);
  }

  private validatePlaceParams(params: PlaceGeocodeParams): void {
    if (!params.place_id) {
      throw new Error("Place ID is required.");
    }
    if (!params.place_id.startsWith("ChIJ")) {
      throw new Error('Invalid Place ID format. Must start with "ChIJ".');
    }
    this.validateCommonParams(params);
  }

  private validateCommonParams(params: {
    language?: string;
    region?: string;
  }): void {
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
