// Calculate distance between two GPS coordinates using the Haversine formula (Returns meters)
export function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Radius of Earth in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Define your authorized locations (Church + Test / Home Location)
const ALLOWED_LOCATIONS = [
    {
        name: "Main Venue (Church)",
        latitude: 6.569404,     // Replace with actual church latitude from Google Maps
        longitude: 3.374825,    // Replace with actual church longitude from Google Maps
        radiusMeters: 100,    // 100m radius
    },
    {
        name: "Test Location (My House)",
        latitude: 6.559419,     // Replace with your house latitude from Google Maps
        longitude: 3.379833,    // Replace with your house longitude from Google Maps
        radiusMeters: 100,    // 100m radius (or make it larger like 500m for testing if needed)
    },
];

// Set to true while testing locally, false when pushing to production!
const IS_TESTING_MODE = true;

// Async utility to verify browser geolocation against multiple venue bounds
export async function verifyUserLocation(): Promise<{ allowed: boolean; distance: number; message?: string }> {
    return new Promise((resolve) => {
        // If testing mode is active, you can bypass GPS or test freely
        if (IS_TESTING_MODE && process.env.NODE_ENV === 'development') {
            console.log("⚠️ Geofencing Test Mode Active: Bypassing strict GPS checks.");
            resolve({ allowed: true, distance: 0 });
            return;
        }

        if (!navigator.geolocation) {
            resolve({ allowed: false, distance: 0, message: "Geolocation is not supported by your browser." });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLon = position.coords.longitude;

                // Check user's distance against ALL allowed locations
                let closestDistance = Infinity;
                let isWithinAnyLocation = false;

                for (const loc of ALLOWED_LOCATIONS) {
                    const distance = getDistanceFromLatLonInMeters(userLat, userLon, loc.latitude, loc.longitude);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                    }
                    if (distance <= loc.radiusMeters) {
                        isWithinAnyLocation = true;
                        break;
                    }
                }

                resolve({
                    allowed: isWithinAnyLocation,
                    distance: Math.round(closestDistance),
                    message: isWithinAnyLocation
                        ? undefined
                        : `You are approximately ${Math.round(closestDistance)}m away from authorized premises.`
                });
            },
            (error) => {
                console.warn("Geolocation error:", error);
                resolve({
                    allowed: false,
                    distance: 0,
                    message: "Location access is required to verify you are on the premises. Please enable location services."
                });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });
}