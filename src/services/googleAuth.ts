import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";

import {
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase";

// ==================================================
// GOOGLE WEB CLIENT ID
// ==================================================

const WEB_CLIENT_ID =
  "521297826504-1f644i6c21kbrgv0pb4f5hcprqrpsd7h.apps.googleusercontent.com";

// ==================================================
// GOOGLE SIGN-IN CONFIG
// ==================================================

GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
  offlineAccess: false,
});

// ==================================================
// FIRESTORE PROFILE SAVE
// Runs in background so Google login is not blocked
// by a slow Firestore request.
// ==================================================

async function saveGoogleUserProfile(firebaseUser: any) {
  try {
    console.log(
      "[GoogleAuth] Saving user profile to Firestore..."
    );

    await setDoc(
      doc(db, "users", firebaseUser.uid),
      {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || "User",
        email: firebaseUser.email || "",
        phone: firebaseUser.phoneNumber || "",
        gender: "",
        photoURL: firebaseUser.photoURL || "",
        authProvider: "google.com",
        updatedAt: serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    console.log(
      "[GoogleAuth] Firestore profile saved."
    );
  } catch (error) {
    // Do not fail Google login just because Firestore
    // profile saving is slow or temporarily unavailable.
    console.error(
      "[GoogleAuth] Firestore profile save failed:",
      error
    );
  }
}

// ==================================================
// GOOGLE LOGIN
// ==================================================

export async function signInWithGoogle() {
  try {
    console.log("[GoogleAuth] Checking Play Services...");

    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    console.log("[GoogleAuth] Opening Google Sign-In...");

    const response = await GoogleSignin.signIn({});

    if (!isSuccessResponse(response)) {
      console.log("[GoogleAuth] User cancelled Google login.");

      return {
        success: false,
        cancelled: true,
        user: null,
        code: "CANCELLED",
        message: "Google login cancelled.",
      };
    }

    const idToken = response.data.idToken;

    if (!idToken) {
      throw new Error(
        "Google ID token nahi mila. Google OAuth configuration check karo."
      );
    }

    console.log(
      "[GoogleAuth] Google token received."
    );

    const credential =
      GoogleAuthProvider.credential(idToken);

    console.log(
      "[GoogleAuth] Signing into Firebase..."
    );

    const result = await signInWithCredential(
      auth,
      credential
    );

    const firebaseUser = result.user;

    console.log(
      "[GoogleAuth] Firebase login successful:",
      firebaseUser.uid
    );

    // IMPORTANT:
    // Do not await Firestore here. Firebase Auth is already
    // successful, so let the app continue immediately.
    void saveGoogleUserProfile(firebaseUser);

    return {
      success: true,
      cancelled: false,
      user: firebaseUser,
      code: undefined,
      message: "",
    };
  } catch (error: any) {
    console.error(
      "[GoogleAuth] Sign-in error:",
      error
    );

    return {
      success: false,
      cancelled: false,
      user: null,
      code: error?.code,
      message:
        error?.message ||
        "Google sign-in failed.",
    };
  }
}