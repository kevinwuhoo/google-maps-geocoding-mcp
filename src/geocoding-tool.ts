import {
  Client,
  GeocodeResponse,
  GeocodeRequest,
  ReverseGeocodeRequest,
} from "@googlemaps/google-maps-services-js";
import { Status } from "@googlemaps/google-maps-services-js/dist/common.js";
import { ServerConfig } from "./config.js";

/**
 * Type Strategy for Google Maps API Integration
 *
 * The @googlemaps/google-maps-services-js library provides TypeScript types that are
 * more restrictive than what the actual Google Maps Geocoding API accepts.
 *
 * Key discrepancies:
 * 1. The API accepts flexible string values for language, result_type, location_type
 *    but the library uses strict enums/types
 * 2. Some valid API parameters are missing from the TypeScript definitions entirely
 *    (e.g., result_type and location_type for forward geocoding)
 *
 * Our approach:
 * - Use the library types as a base for type safety on core fields
 * - Accept flexible string/string[] types in our MCP interface for maximum compatibility
 * - Use type intersections and assertions when calling the library to bridge the gap
 * - Document each workaround with references to official API documentation
 *
 * This ensures our MCP server exposes the full capabilities of the Google Maps API
 * while still benefiting from the type safety the library provides.
 */

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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      return this.handleError(error);
    }
  }

  private async executeForwardGeocode(params: ForwardGeocodeParams) {
    /**
     * IMPORTANT: TypeScript Library Limitations
     *
     * The @googlemaps/google-maps-services-js library's TypeScript definitions are incomplete
     * compared to what the actual Google Maps Geocoding API accepts.
     *
     * According to the official API documentation:
     * https://developers.google.com/maps/documentation/geocoding/requests-geocoding
     *
     * Forward geocoding DOES support these optional parameters:
     * - result_type: Filter results to specific address types (e.g., "street_address")
     * - location_type: Filter by location precision (e.g., "ROOFTOP", "APPROXIMATE")
     *
     * However, the library's GeocodeRequest type doesn't include these fields.
     * We use type intersection with Record<string, unknown> and type assertions (as never)
     * to work around this limitation while still maintaining type safety for known fields.
     */
    const requestParams: GeocodeRequest["params"] & Record<string, unknown> = {
      address: params.address,
      key: this.config.apiKey,
      language: params.language || this.config.defaultLanguage || undefined,
      region: params.region || this.config.defaultRegion || undefined,
      components: params.components || undefined,
      bounds: params.bounds || undefined,
      // These parameters ARE supported by the API but missing from TypeScript definitions
      ...(params.result_type && { result_type: params.result_type as never }),
      ...(params.location_type && {
        location_type: params.location_type as never,
      }),
    };

    // Remove undefined values to avoid issues with exactOptionalPropertyTypes
    Object.keys(requestParams).forEach(
      (key) =>
        requestParams[key] === undefined &&
        delete requestParams[key as keyof typeof requestParams],
    );

    const response = await this.client.geocode({
      params: requestParams,
      timeout: this.config.timeout || 5000,
    });

    return { response, requestParams };
  }

  private async executeReverseGeocode(params: ReverseGeocodeParams) {
    /**
     * TypeScript Library Limitations for Reverse Geocoding
     *
     * Per official documentation:
     * https://developers.google.com/maps/documentation/geocoding/requests-geocoding#ReverseGeocoding
     *
     * The ReverseGeocodeRequest type has several issues:
     * 1. language is typed as Language enum but API accepts any BCP-47 language code string
     * 2. result_type is typed as AddressType[] but API accepts string array
     * 3. location_type is typed as ReverseGeocodingLocationType[] but API accepts string array
     * 4. region parameter isn't documented for reverse geocoding but the API accepts it
     *
     * We use type assertions (as never) to bypass these overly restrictive types.
     */
    const requestParams: ReverseGeocodeRequest["params"] &
      Record<string, unknown> = {
      latlng: params.latlng, // Library accepts string format
      key: this.config.apiKey,
      language: (params.language ||
        this.config.defaultLanguage ||
        undefined) as never,
      result_type: params.result_type as never,
      location_type: params.location_type as never,
      // Region works in practice even though not documented for reverse geocoding
      ...(params.region && { region: params.region }),
    };

    // Remove undefined values
    Object.keys(requestParams).forEach(
      (key) =>
        requestParams[key] === undefined &&
        delete requestParams[key as keyof typeof requestParams],
    );

    const response = await this.client.reverseGeocode({
      params: requestParams,
      timeout: this.config.timeout || 5000,
    });

    return { response, requestParams };
  }

  private async executePlaceGeocode(params: PlaceGeocodeParams) {
    /**
     * TypeScript Library Limitations for Place Geocoding
     *
     * Per official documentation:
     * https://developers.google.com/maps/documentation/geocoding/requests-geocoding#place-id
     *
     * Place geocoding uses the same endpoint as forward geocoding, just with place_id
     * instead of address. The API accepts all the same optional parameters:
     * - language: Language for results
     * - region: Region code for biasing
     * - result_type: Filter results (though less useful with place_id)
     * - location_type: Filter by precision (though less useful with place_id)
     *
     * The library correctly routes place_id through geocode() not reverseGeocode(),
     * but still doesn't include result_type and location_type in the type definitions.
     */
    const requestParams: GeocodeRequest["params"] & Record<string, unknown> = {
      place_id: params.place_id,
      key: this.config.apiKey,
      language: params.language || this.config.defaultLanguage || undefined,
      // These work with place geocoding even if not commonly used
      ...(params.result_type && { result_type: params.result_type as never }),
      ...(params.location_type && {
        location_type: params.location_type as never,
      }),
      ...(params.region && { region: params.region }),
    };

    // Remove undefined values
    Object.keys(requestParams).forEach(
      (key) =>
        requestParams[key] === undefined &&
        delete requestParams[key as keyof typeof requestParams],
    );

    const response = await this.client.geocode({
      params: requestParams,
      timeout: this.config.timeout || 5000,
    });

    return { response, requestParams };
  }

  /**
   * Handle API errors consistently
   */
  private handleError(error: unknown): GeocodeToolResponse {
    if (error && typeof error === "object" && "response" in error) {
      const apiError = error as { response?: { data?: unknown } };
      if (apiError.response?.data) {
        return apiError.response.data as GeocodeToolResponse;
      }
    }
    // For non-API errors, create a response in the expected format
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: Status.INVALID_REQUEST,
      results: [],
      error_message: message,
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
