import { api } from "@/lib/api";

export interface ReverseGeocodeResult {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  formatted: string;
}

/** Wraps the callback-based browser Geolocation API in a promise with a friendly error per failure mode. */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Your browser doesn't support location detection. Please enter your address manually."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      resolve,
      (err) => {
        if (err.code === err.PERMISSION_DENIED) reject(new Error("Location access was blocked. You can allow it in your browser's site settings, or enter your address manually."));
        else if (err.code === err.TIMEOUT) reject(new Error("Detecting your location took too long. Please try again or enter your address manually."));
        else reject(new Error("Couldn't get your location. Please enter your address manually."));
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  });
}

/** Asks OUR server to reverse-geocode (never calls a third party directly from the browser). */
export async function reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult> {
  const { data } = await api.get<{ data: ReverseGeocodeResult }>("/geocode/reverse", { params: { lat, lon } });
  return data.data;
}

/** One-shot: get the browser's current position and resolve it to an address. */
export async function detectCurrentAddress(): Promise<ReverseGeocodeResult> {
  const pos = await getCurrentPosition();
  return reverseGeocode(pos.coords.latitude, pos.coords.longitude);
}
