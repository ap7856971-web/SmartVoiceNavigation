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
// GOOGLE LOGIN
// ==================================================

export async function signInWithGoogle() {
  try {
    // Check Google Play Services
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    // Open Google account picker
    const response = await GoogleSignin.signIn({});

    // User cancelled the Google login
    if (!isSuccessResponse(response)) {
      return {
        success: false,
        cancelled: true,
        user: null,
      };
    }

    // Get Google ID token
    const idToken = response.data.idToken;

    if (!idToken) {
      throw new Error(
        "Google ID token nahi mila. Google OAuth configuration check karo."
      );
    }

    // Create Firebase credential
    const credential =
      GoogleAuthProvider.credential(idToken);

    // Login into Firebase
    const result = await signInWithCredential(
      auth,
      credential
    );

    const firebaseUser = result.user;

    // Save/update profile in Firestore
    await setDoc(
      doc(db, "users", firebaseUser.uid),
      {
        uid: firebaseUser.uid,

        name:
          firebaseUser.displayName ||
          "User",

        email:
          firebaseUser.email ||
          "",

        phone:
          firebaseUser.phoneNumber ||
          "",

        gender: "",

        photoURL:
          firebaseUser.photoURL ||
          "",

        authProvider: "google.com",

        updatedAt:
          serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    return {
      success: true,
      cancelled: false,
      user: firebaseUser,
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