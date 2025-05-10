from geopy.geocoders import Nominatim
from geopy.distance import geodesic
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import time

# Initialize geolocator once
geolocator = Nominatim(user_agent="my_free_app")

# Helper to retry geocoding on timeout
def geocode_with_retry(address, max_retries=3, delay=1, timeout=10):
    for attempt in range(max_retries):
        try:
            return geolocator.geocode(address, timeout=timeout)
        except GeocoderTimedOut:
            if attempt < max_retries - 1:
                time.sleep(delay)
                continue
            return None
        except GeocoderServiceError:
            # Service error, break and return None
            return None
    return None

# Main distance calculation with fault tolerance
def get_straight_line_km(address1, address2):
    try:
        # Geocode first address
        loc1 = geocode_with_retry(address1)
        if not loc1:
            return 0

        # Throttle to respect usage policy
        time.sleep(1)

        # Geocode second address
        loc2 = geocode_with_retry(address2)
        if not loc2:
            return 0

        # Compute geodesic distance
        coords1 = (loc1.latitude, loc1.longitude)
        coords2 = (loc2.latitude, loc2.longitude)
        return geodesic(coords1, coords2).km

    except Exception:
        # Catch unexpected errors
        return 0

# Uncomment to test manually
# if __name__ == '__main__':
#     origin = "735 Morledge, Derby DE1 2AY"
#     dest   = "Markeaton Street, Derby DE22 3AW"
#     print(f"Distance: {get_straight_line_km(origin, dest):.2f} km")
