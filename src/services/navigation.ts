import * as Location from "expo-location";


// ==================================================
// TYPES
// ==================================================

type NavigationRequest = {
  destination: string;
};


// ==================================================
// STATE
// ==================================================

let navigationListener:
  | ((request: NavigationRequest) => void)
  | null = null;

let currentNavigation:
  | NavigationRequest
  | null = null;


// ==================================================
// SET MAP NAVIGATION LISTENER
// ==================================================

export function setNavigationListener(
  listener: (
    request: NavigationRequest
  ) => void
) {
  navigationListener = listener;

  console.log(
    "[Navigation] Map listener registered"
  );

  return () => {
    if (
      navigationListener ===
      listener
    ) {
      navigationListener = null;

      console.log(
        "[Navigation] Map listener removed"
      );
    }
  };
}


// ==================================================
// START IN-APP NAVIGATION
// ==================================================

export async function startNavigation(
  destination: string
): Promise<boolean> {

  const trimmed =
    destination?.trim();

  if (!trimmed) {
    console.log(
      "[Navigation] No destination"
    );

    return false;
  }

  currentNavigation = {
    destination: trimmed,
  };

  console.log(
    "[Navigation] Starting in-app navigation:",
    trimmed
  );


  // ----------------------------------------------
  // Send destination to Map screen
  // ----------------------------------------------

  if (navigationListener) {

    navigationListener({
      destination: trimmed,
    });

    return true;
  }


  console.log(
    "[Navigation] Map listener not ready"
  );

  return false;
}


// ==================================================
// SEARCH NEARBY
// ==================================================
//
// IMPORTANT:
// This does NOT open Google Maps.
//
// It sends the search request to your own MapView.
// Your map screen can then show nearby places.
//

export async function searchNearby(
  category: string
): Promise<boolean> {

  const trimmed =
    category?.trim();

  if (!trimmed) {
    console.log(
      "[Navigation] No nearby category"
    );

    return false;
  }

  console.log(
    "[Navigation] Searching nearby:",
    trimmed
  );


  // ----------------------------------------------
  // For now, send nearby request through
  // the same map listener.
  //
  // If your MapView listener only accepts
  // destination, category will be used as
  // the destination/search request.
  // ----------------------------------------------

  if (navigationListener) {

    navigationListener({
      destination: trimmed,
    });

    return true;
  }


  console.log(
    "[Navigation] Map listener not ready for nearby search"
  );

  return false;
}


// ==================================================
// CURRENT NAVIGATION
// ==================================================

export function getCurrentNavigation() {

  return currentNavigation;
}


// ==================================================
// CLEAR NAVIGATION
// ==================================================

export function clearNavigation() {

  currentNavigation = null;

  console.log(
    "[Navigation] Navigation cleared"
  );
}


// ==================================================
// CURRENT LOCATION
// ==================================================

export async function getNavigationLocation() {

  try {

    const {
      status,
    } =
      await Location.requestForegroundPermissionsAsync();

    if (
      status !== "granted"
    ) {

      console.log(
        "[Navigation] Location permission denied"
      );

      return null;
    }


    const location =
      await Location.getCurrentPositionAsync(
        {
          accuracy:
            Location.Accuracy.High,
        }
      );


    return {
      latitude:
        location.coords.latitude,

      longitude:
        location.coords.longitude,
    };

  } catch (error) {

    console.log(
      "[Navigation] Location error:",
      error
    );

    return null;
  }
}


// ==================================================
// STOP NAVIGATION
// ==================================================

export function stopNavigation() {

  currentNavigation = null;

  console.log(
    "[Navigation] Navigation stopped"
  );
}