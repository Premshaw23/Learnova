import { useCallback } from "react";

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const radius = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  return radius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function normalizeGeolocationSettings(settings: any) {
  const gpsLocation = settings?.gpsLocation;
  if (!gpsLocation) return null;

  const radius =
    gpsLocation.radius ??
    gpsLocation.radius_meters ??
    gpsLocation.radiusMeters ??
    0;

  return {
    lat: Number(gpsLocation.lat),
    lng: Number(gpsLocation.lng),
    radius: Number(radius),
  };
}

export function useGeolocation() {
  const requestCurrentPosition = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return Promise.reject(
        new Error("Geolocation is not supported by this browser")
      );
    }

    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    });
  }, []);

  return {
    requestCurrentPosition,
    calculateDistanceMeters,
    normalizeGeolocationSettings,
  };
}
