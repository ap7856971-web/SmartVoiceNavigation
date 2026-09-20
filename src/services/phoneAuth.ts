// src/services/phoneAuth.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  signInAnonymously,
} from "firebase/auth";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase";

// ==================================================
// TYPES
// ==================================================

export interface PhoneOTPResult {
  success: boolean;
  phone: string;
  otp?: string;
  expiresAt?: number;
  uid?: string;
  name?: string;
  isNewUser?: boolean;
}

// ==================================================
// LOCAL STORAGE KEYS
// ==================================================

const PHONE_PROFILE_KEY =
  "smartVoice_phone_profile";

const PHONE_UID_KEY =
  "smartVoice_phone_uid";

// ==================================================
// TEST OTP VARIABLES
// ==================================================

let generatedOTP: string | null = null;

let otpExpiresAt: number | null = null;

let pendingPhone: string | null = null;

// ==================================================
// PHONE VALIDATION
// ==================================================

function validateIndianPhoneNumber(
  phoneNumber: string
): boolean {

  if (!phoneNumber) {
    return false;
  }

  const cleaned =
    phoneNumber
      .trim()
      .replace(/\s/g, "");

  let number = cleaned;

  if (number.startsWith("+91")) {

    number =
      number.substring(3);

  } else if (
    number.startsWith("91") &&
    number.length === 12
  ) {

    number =
      number.substring(2);
  }

  return /^[6-9][0-9]{9}$/.test(
    number
  );
}

// ==================================================
// NORMALIZE PHONE
// ==================================================

function normalizePhoneNumber(
  phoneNumber: string
): string {

  let number =
    phoneNumber
      .trim()
      .replace(/\s/g, "");

  if (number.startsWith("+91")) {

    number =
      number.substring(3);

  } else if (
    number.startsWith("91") &&
    number.length === 12
  ) {

    number =
      number.substring(2);
  }

  return `+91${number}`;
}

// ==================================================
// GENERATE OTP
// ==================================================

function generateOTP(): string {

  return Math.floor(
    100000 +
      Math.random() * 900000
  ).toString();
}

// ==================================================
// SEND TEST OTP
// ==================================================

export async function sendPhoneOTP(
  phoneNumber: string
): Promise<PhoneOTPResult> {

  try {

    console.log(
      "[PhoneAuth] Starting TEST OTP flow..."
    );

    console.log(
      "[PhoneAuth] Input phone:",
      phoneNumber
    );

    // ------------------------------------------
    // VALIDATE
    // ------------------------------------------

    if (
      !validateIndianPhoneNumber(
        phoneNumber
      )
    ) {

      throw {
        code:
          "INVALID_PHONE_NUMBER",

        message:
          "Please enter a valid 10-digit Indian mobile number.",
      };
    }

    // ------------------------------------------
    // NORMALIZE
    // ------------------------------------------

    const phone =
      normalizePhoneNumber(
        phoneNumber
      );

    console.log(
      "[PhoneAuth] Valid phone:",
      phone
    );

    // ------------------------------------------
    // GENERATE OTP
    // ------------------------------------------

    const otp =
      generateOTP();

    generatedOTP =
      otp;

    pendingPhone =
      phone;

    otpExpiresAt =
      Date.now() +
      5 * 60 * 1000;

    console.log(
      "===================================="
    );

    console.log(
      "[TEST OTP] Generated:",
      otp
    );

    console.log(
      "[TEST OTP] Phone:",
      phone
    );

    console.log(
      "[TEST OTP] Valid for: 5 minutes"
    );

    console.log(
      "===================================="
    );

    return {

      success: true,

      phone,

      otp,

      expiresAt:
        otpExpiresAt,
    };

  } catch (error: any) {

    console.error(
      "[PhoneAuth] Send OTP error:",
      error
    );

    throw error;
  }
}

// ==================================================
// VERIFY TEST OTP
// ==================================================

export async function verifyPhoneOTP(
  enteredOTP: string
): Promise<PhoneOTPResult> {

  try {

    console.log(
      "[PhoneAuth] Verifying TEST OTP..."
    );

    // ==========================================
    // CHECK OTP
    // ==========================================

    if (
      !generatedOTP ||
      !pendingPhone
    ) {

      throw {
        code:
          "OTP_NOT_FOUND",

        message:
          "Please request OTP first.",
      };
    }

    // ==========================================
    // EXPIRY
    // ==========================================

    if (
      otpExpiresAt &&
      Date.now() >
        otpExpiresAt
    ) {

      clearPhoneOTP();

      throw {
        code:
          "OTP_EXPIRED",

        message:
          "OTP has expired. Please request a new OTP.",
      };
    }

    // ==========================================
    // VALIDATE OTP
    // ==========================================

    const entered =
      enteredOTP.trim();

    if (
      !/^[0-9]{6}$/.test(
        entered
      )
    ) {

      throw {
        code:
          "INVALID_OTP",

        message:
          "Please enter a valid 6-digit OTP.",
      };
    }

    // ==========================================
    // COMPARE
    // ==========================================

    if (
      entered !== generatedOTP
    ) {

      throw {
        code:
          "INVALID_OTP",

        message:
          "Invalid OTP. Please check the OTP.",
      };
    }

    // ==========================================
    // OTP SUCCESS
    // ==========================================

    const verifiedPhone =
      pendingPhone;

    console.log(
      "[PhoneAuth] OTP verified successfully."
    );

    // ==========================================
    // LOAD LOCAL PROFILE
    // ==========================================

    let savedProfile: any = null;

    try {

      const saved =
        await AsyncStorage.getItem(
          PHONE_PROFILE_KEY
        );

      if (saved) {

        const parsed =
          JSON.parse(saved);

        if (
          parsed &&
          parsed.phone ===
            verifiedPhone
        ) {

          savedProfile =
            parsed;

          console.log(
            "[PhoneAuth] Existing local profile found"
          );
        }
      }

    } catch (error) {

      console.error(
        "[PhoneAuth] Local profile read error:",
        error
      );
    }

    // ==========================================
    // FIREBASE AUTH SESSION
    // ==========================================
    //
    // IMPORTANT:
    //
    // This is still TEST OTP.
    //
    // Anonymous Auth is only being used to
    // provide Firebase auth.currentUser.
    //
    // Same phone -> same Firebase UID is NOT
    // guaranteed with anonymous auth.
    //
    // ==========================================

    let firebaseUser =
      auth.currentUser;

    if (!firebaseUser) {

      console.log(
        "[PhoneAuth] Creating Firebase test auth user..."
      );

      const credential =
        await signInAnonymously(
          auth
        );

      firebaseUser =
        credential.user;

    } else {

      console.log(
        "[PhoneAuth] Firebase user already exists:",
        firebaseUser.uid
      );
    }

    // ==========================================
    // AUTH CHECK
    // ==========================================

    if (!firebaseUser) {

      throw {
        code:
          "FIREBASE_AUTH_FAILED",

        message:
          "Firebase authentication failed.",
      };
    }

    const uid =
      firebaseUser.uid;

    console.log(
      "[PhoneAuth] Firebase Auth UID:",
      uid
    );

    // ==========================================
    // PROFILE DATA
    // ==========================================

    const profile = {

      uid,

      phone:
        verifiedPhone,

      name:
        savedProfile?.name ||
        "",

      email:
        savedProfile?.email ||
        "",

      gender:
        savedProfile?.gender ||
        "",

      photoURL:
        savedProfile?.photoURL ||
        "",

      authProvider:
        "phone-test",

      updatedAt:
        Date.now(),
    };

    // ==========================================
    // LOCAL SAVE
    // ==========================================

    try {

      await AsyncStorage.setItem(
        PHONE_PROFILE_KEY,
        JSON.stringify(
          profile
        )
      );

      await AsyncStorage.setItem(
        PHONE_UID_KEY,
        uid
      );

      console.log(
        "[PhoneAuth] Local profile saved"
      );

    } catch (error) {

      console.error(
        "[PhoneAuth] Local profile save failed:",
        error
      );
    }

    // ==========================================
    // FIRESTORE BACKGROUND SYNC
    // ==========================================
    //
    // IMPORTANT:
    //
    // Firestore failure MUST NOT fail login.
    //
    // No getDoc()
    // No timeout
    // No await
    //
    // ==========================================

    void saveProfileToFirestore(
      profile
    );

    // ==========================================
    // CLEAR OTP
    // ==========================================

    clearPhoneOTP();

    // ==========================================
    // SUCCESS
    // ==========================================

    console.log(
      "[PhoneAuth] TEST OTP login completed successfully."
    );

    console.log(
      "[PhoneAuth] User name:",
      profile.name
    );

    return {

      success: true,

      phone:
        verifiedPhone,

      uid,

      name:
        profile.name,

      isNewUser:
        !savedProfile,
    };

  } catch (error: any) {

    console.error(
      "[PhoneAuth] OTP verification error:",
      error?.code
    );

    console.error(
      "[PhoneAuth] OTP verification message:",
      error?.message
    );

    throw error;
  }
}

// ==================================================
// FIRESTORE BACKGROUND SAVE
// ==================================================

async function saveProfileToFirestore(
  profile: any
) {

  try {

    console.log(
      "[PhoneAuth] Starting background Firestore sync..."
    );

    await setDoc(
      doc(
        db,
        "users",
        profile.uid
      ),
      {
        uid:
          profile.uid,

        phone:
          profile.phone,

        name:
          profile.name,

        email:
          profile.email,

        gender:
          profile.gender,

        photoURL:
          profile.photoURL,

        authProvider:
          "phone-test",

        updatedAt:
          serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    console.log(
      "[PhoneAuth] Firestore profile saved successfully"
    );

  } catch (error: any) {

    // ------------------------------------------
    // IMPORTANT:
    // DO NOT FAIL LOGIN
    // ------------------------------------------

    console.log(
      "[PhoneAuth] Firestore offline/unavailable."
    );

    console.log(
      "[PhoneAuth] Profile remains saved locally."
    );

    console.log(
      "[PhoneAuth] Firestore error:",
      error?.code,
      error?.message
    );
  }
}

// ==================================================
// GET LOCAL PROFILE
// ==================================================

export async function getSavedPhoneProfile() {

  try {

    const saved =
      await AsyncStorage.getItem(
        PHONE_PROFILE_KEY
      );

    if (!saved) {
      return null;
    }

    return JSON.parse(
      saved
    );

  } catch (error) {

    console.error(
      "[PhoneAuth] Get local profile failed:",
      error
    );

    return null;
  }
}

// ==================================================
// GET SAVED PHONE UID
// ==================================================

export async function getSavedPhoneUID() {

  try {

    return await AsyncStorage.getItem(
      PHONE_UID_KEY
    );

  } catch (error) {

    console.error(
      "[PhoneAuth] Get UID failed:",
      error
    );

    return null;
  }
}

// ==================================================
// SAVE LOCAL PROFILE
// ==================================================

export async function savePhoneProfile(
  profile: any
) {

  try {

    await AsyncStorage.setItem(
      PHONE_PROFILE_KEY,
      JSON.stringify(
        profile
      )
    );

    console.log(
      "[PhoneAuth] Phone profile updated locally"
    );

  } catch (error) {

    console.error(
      "[PhoneAuth] Save phone profile failed:",
      error
    );
  }
}

// ==================================================
// CLEAR OTP
// ==================================================

export function clearPhoneOTP() {

  generatedOTP =
    null;

  otpExpiresAt =
    null;

  pendingPhone =
    null;

  console.log(
    "[PhoneAuth] TEST OTP cleared."
  );
}