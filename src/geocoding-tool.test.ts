import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  GeocodingTool,
  ForwardGeocodeParams,
  ReverseGeocodeParams,
  PlaceGeocodeParams,
} from "./geocoding-tool.js";
import { ServerConfig } from "./config.js";
import { Status } from "@googlemaps/google-maps-services-js/dist/common";

// Mock the Google Maps client
vi.mock("@googlemaps/google-maps-services-js", () => ({
  Client: vi.fn(() => ({
    geocode: vi.fn(),
    reverseGeocode: vi.fn(),
  })),
  Status: {
    OK: "OK",
    INVALID_REQUEST: "INVALID_REQUEST",
    OVER_QUERY_LIMIT: "OVER_QUERY_LIMIT",
    REQUEST_DENIED: "REQUEST_DENIED",
    UNKNOWN_ERROR: "UNKNOWN_ERROR",
    ZERO_RESULTS: "ZERO_RESULTS",
  },
}));

describe("GeocodingTool", () => {
  let geocodingTool: GeocodingTool;
  let mockConfig: ServerConfig;

  beforeEach(() => {
    mockConfig = {
      apiKey: "test_api_key",
      timeout: 5000,
      defaultLanguage: "en",
    };
    geocodingTool = new GeocodingTool(mockConfig);
  });

  describe("Forward Geocoding Validation", () => {
    it("should return error response for empty address", async () => {
      const params: ForwardGeocodeParams = { address: "" };

      const result = await geocodingTool.geocodeForward(params);
      expect(result.status).toBe(Status.INVALID_REQUEST);
      expect(result.error_message).toBe("Address is required.");
      expect(result.results).toEqual([]);
    });

    it("should return error response for whitespace-only address", async () => {
      const params: ForwardGeocodeParams = { address: "   " };

      const result = await geocodingTool.geocodeForward(params);
      expect(result.status).toBe(Status.INVALID_REQUEST);
      expect(result.error_message).toBe("Address is required.");
      expect(result.results).toEqual([]);
    });

    it("should return error response for address longer than 2048 characters", async () => {
      const longAddress = "a".repeat(2049);
      const params: ForwardGeocodeParams = { address: longAddress };

      const result = await geocodingTool.geocodeForward(params);
      expect(result.status).toBe(Status.INVALID_REQUEST);
      expect(result.error_message).toBe(
        "Address must be less than 2048 characters."
      );
      expect(result.results).toEqual([]);
    });

    it("should fail gracefully for valid address without API key", async () => {
      const params: ForwardGeocodeParams = {
        address: "1600 Amphitheatre Parkway, Mountain View, CA",
      };

      // Should return an error response (not throw) because no real API key
      const result = await geocodingTool.geocodeForward(params);
      expect(result.status).toBe(Status.INVALID_REQUEST);
      expect(result.results).toEqual([]);
      // Should have passed validation - error should not be about address requirements
      expect(result.error_message).not.toBe("Address is required.");
    });
  });

  describe("Reverse Geocoding Validation", () => {
    it("should return error response for missing latlng", async () => {
      const params = {} as ReverseGeocodeParams;

      const result = await geocodingTool.geocodeReverse(params);
      expect(result.status).toBe(Status.INVALID_REQUEST);
      expect(result.error_message).toBe("Latlng is required.");
      expect(result.results).toEqual([]);
    });

    it("should return error response for invalid latlng format", async () => {
      const params: ReverseGeocodeParams = { latlng: "invalid" };

      const result = await geocodingTool.geocodeReverse(params);
      expect(result.status).toBe(Status.INVALID_REQUEST);
      expect(result.error_message).toBe(
        'Invalid latlng format. Expected: "latitude,longitude"'
      );
      expect(result.results).toEqual([]);
    });

    it("should return error response for latlng with invalid latitude", async () => {
      const params: ReverseGeocodeParams = { latlng: "91.0,-122.0" }; // lat > 90

      const result = await geocodingTool.geocodeReverse(params);
      expect(result.status).toBe(Status.INVALID_REQUEST);
      expect(result.error_message).toBe(
        'Invalid latlng format. Expected: "latitude,longitude"'
      );
      expect(result.results).toEqual([]);
    });

    it("should return error response for latlng with invalid longitude", async () => {
      const params: ReverseGeocodeParams = { latlng: "37.0,181.0" }; // lng > 180

      const result = await geocodingTool.geocodeReverse(params);
      expect(result.status).toBe(Status.INVALID_REQUEST);
      expect(result.error_message).toBe(
        'Invalid latlng format. Expected: "latitude,longitude"'
      );
      expect(result.results).toEqual([]);
    });

    it("should fail gracefully for valid latlng without API key", async () => {
      const params: ReverseGeocodeParams = {
        latlng: "37.4224764,-122.0842499",
      };

      // Should return an error response (not throw) because no real API key
      const result = await geocodingTool.geocodeReverse(params);
      expect(result.status).toBe(Status.INVALID_REQUEST);
      expect(result.results).toEqual([]);
      // Should have passed validation - error should not be about latlng format
      expect(result.error_message).not.toBe(
        'Invalid latlng format. Expected: "latitude,longitude"'
      );
    });
  });

  describe("Place Geocoding Validation", () => {
    it("should return error response for missing place_id", async () => {
      const params = {} as PlaceGeocodeParams;

      const result = await geocodingTool.geocodePlace(params);
      expect(result.status).toBe(Status.INVALID_REQUEST);
      expect(result.error_message).toBe("Place ID is required.");
      expect(result.results).toEqual([]);
    });

    it("should return error response for invalid place_id format", async () => {
      const params: PlaceGeocodeParams = { place_id: "invalid_place_id" };

      const result = await geocodingTool.geocodePlace(params);
      expect(result.status).toBe(Status.INVALID_REQUEST);
      expect(result.error_message).toBe(
        'Invalid Place ID format. Must start with "ChIJ".'
      );
      expect(result.results).toEqual([]);
    });

    it("should fail gracefully for valid place_id without API key", async () => {
      const params: PlaceGeocodeParams = {
        place_id: "ChIJd8BlQ2BZwokRAFUEcm_qrcA",
      };

      // Should return an error response (not throw) because no real API key
      const result = await geocodingTool.geocodePlace(params);
      expect(result.status).toBe(Status.INVALID_REQUEST);
      expect(result.results).toEqual([]);
      // Should have passed validation - error should not be about place_id format
      expect(result.error_message).not.toBe(
        'Invalid Place ID format. Must start with "ChIJ".'
      );
    });
  });

  describe("Common Parameter Validation", () => {
    it("should return error response for invalid language format", async () => {
      const params: ForwardGeocodeParams = {
        address: "1600 Amphitheatre Parkway",
        language: "invalid-lang",
      };

      const result = await geocodingTool.geocodeForward(params);
      expect(result.status).toBe(Status.INVALID_REQUEST);
      expect(result.error_message).toBe(
        'Invalid language format. Expected: "en", "en-US", etc.'
      );
      expect(result.results).toEqual([]);
    });

    it("should return error response for invalid region format", async () => {
      const params: ForwardGeocodeParams = {
        address: "1600 Amphitheatre Parkway",
        region: "USA", // should be 'us'
      };

      const result = await geocodingTool.geocodeForward(params);
      expect(result.status).toBe(Status.INVALID_REQUEST);
      expect(result.error_message).toBe(
        'Invalid region format. Expected: "us", "uk", etc.'
      );
      expect(result.results).toEqual([]);
    });
  });

  describe("Latitude/Longitude Validation Helper", () => {
    it("should validate various latlng formats through reverse geocoding", async () => {
      const validCoords = [
        "0,0",
        "37.4224764,-122.0842499",
        "90,180",
        "-90,-180",
      ];

      for (const coord of validCoords) {
        const params: ReverseGeocodeParams = { latlng: coord };

        // Should pass validation (but fail on API call since no real key)
        const result = await geocodingTool.geocodeReverse(params);
        expect(result.status).toBe(Status.INVALID_REQUEST);
        expect(result.results).toEqual([]);
        // Should have passed validation - error should not be about latlng format
        expect(result.error_message).not.toBe(
          'Invalid latlng format. Expected: "latitude,longitude"'
        );
      }
    });

    it("should reject invalid latlng formats through reverse geocoding", async () => {
      const invalidCoords = [
        "91,0", // lat > 90
        "-91,0", // lat < -90
        "0,181", // lng > 180
        "0,-181", // lng < -180
        "abc,def", // not numbers
        "37.4224764", // missing longitude
        "37.4224764,", // missing longitude value
        ",122.0842499", // missing latitude value
        "37.4224764,-122.0842499,extra", // too many parts
      ];

      for (const coord of invalidCoords) {
        const params: ReverseGeocodeParams = { latlng: coord };

        const result = await geocodingTool.geocodeReverse(params);
        expect(result.status).toBe(Status.INVALID_REQUEST);
        expect(result.error_message).toBe(
          'Invalid latlng format. Expected: "latitude,longitude"'
        );
        expect(result.results).toEqual([]);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully", async () => {
      const params: ForwardGeocodeParams = { address: "test address" };

      // With our current mock setup, this will return an error response
      const result = await geocodingTool.geocodeForward(params);
      expect(result.status).toBe(Status.INVALID_REQUEST);
      expect(result.results).toEqual([]);
      expect(result.error_message).toBeDefined();
    });
  });

  describe("Configuration", () => {
    it("should use provided configuration", () => {
      expect(geocodingTool).toBeDefined();
    });

    it("should handle missing optional config values", () => {
      const minimalConfig: ServerConfig = {
        apiKey: "test_key",
      };
      const tool = new GeocodingTool(minimalConfig);
      expect(tool).toBeDefined();
    });
  });
});
