export interface CustomerLocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  mapsUrl: string;
}

export function detectCustomerLocation(): Promise<CustomerLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({coords}) => {
        const latitude = coords.latitude;
        const longitude = coords.longitude;
        resolve({
          latitude,
          longitude,
          accuracyMeters: Math.round(coords.accuracy || 0),
          mapsUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
        });
      },
      (error) => {
        reject(new Error(
          error.code === error.PERMISSION_DENIED
            ? 'Location permission was denied. Allow it in your browser and try again.'
            : 'Could not get a fresh location. Please try again.'
        ));
      },
      {enableHighAccuracy: true, maximumAge: 0, timeout: 15000}
    );
  });
}
