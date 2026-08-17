// src/services/phoneAuth.ts

// ============================================
// PHONE AUTH - TEST OTP + FIREBASE AUTH
// ============================================

import { signInAnonymously } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

export interface PhoneOTPResult {
  success: boolean;
  phone: string;
  otp?: string;
  expiresAt?: number;
  uid?: string;
}

// ============================================
// STORED TEST OTP
// ============================================

let generatedOTP: string | null = null;
let otpExpiresAt: number | null = null;
let pendingPhone: string | null = null;

// ============================================
// VALIDATE INDIAN PHONE NUMBER
// ============================================

function validateIndianPhoneNumber(
  phoneNumber: string
): boolean {
  if (!phoneNumber) {
    return false;
  }

  const cleaned = phoneNumber
    .trim()
    .replace(/\s/g, "");

  let number = cleaned;

  if (number.startsWith("+91")) {
    number = number.substring(3);
  } else if (number.startsWith("91") && number.length === 12) {
    number = number.substring(2);
  }

  return /^[6-9][0-9]{9}$/.test(number);
}

// ============================================
// NORMALIZE PHONE NUMBER
// ============================================

function normalizePhoneNumber(
  phoneNumber: string
): string {
  let number = phoneNumber
    .trim()
    .replace(/\s/g, "");

  if (number.startsWith("+91")) {
    number = number.substring(3);
  } else if (
    number.startsWith("91") &&
    number.length === 12
  ) {
    number = number.substring(2);
  }

  return `+91${number}`;
}

// ============================================
// GENERATE 6 DIGIT OTP
// ============================================

function generateOTP(): string {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
}

// ============================================
// SEND PHONE OTP
// TEST OTP ONLY
// ============================================

export async function sendPhoneOTP(
  phoneNumber: string
): Promise<PhoneOTPResult> {
  try {
    console.log("[PhoneAuth] Starting TEST OTP flow...");
    console.log("[PhoneAuth] Input phone:", phoneNumber);

    if (!validateIndianPhoneNumber(phoneNumber)) {
      console.error(
        "[PhoneAuth] Invalid phone number:",
        phoneNumber
      );

      throw {
        code: "INVALID_PHONE_NUMBER",
        message:
          "Invalid phone number. Please enter a valid 10-digit Indian mobile number.",
      };
    }

    const phone = normalizePhoneNumber(phoneNumber);

    console.log("[PhoneAuth] Valid phone:", phone);

    const otp = generateOTP();

    generatedOTP = otp;
    pendingPhone = phone;
    otpExpiresAt = Date.now() + 5 * 60 * 1000;

    console.log("====================================");
    console.log("[TEST OTP] Generated:", otp);
    console.log("[TEST OTP] Phone:", phone);
    console.log("[TEST OTP] Valid for: 5 minutes");
    console.log("====================================");

    console.log("[PhoneAuth] TEST OTP ready.");
    console.log("[PhoneAuth] No SMS will be sent.");

    return {
      success: true,
      phone,
      otp,
      expiresAt: otpExpiresAt,
    };
  } catch (error: any) {
    console.error("[PhoneAuth] Error code:", error?.code);
    console.error("[PhoneAuth] Error message:", error?.message);
    throw error;
  }
}

// ============================================
// VERIFY PHONE OTP
// TEST OTP -> FIREBASE AUTH
//
// IMPORTANT:
// This is TEST OTP, so Firebase Phone Auth is
// NOT being used here.
//
// After OTP verification we create/use a
// Firebase Anonymous Auth session. This gives
// the app a real Firebase auth.currentUser,
// which allows Profile/Firestore to work.
//
// For production SMS OTP, replace this with
// Firebase Phone Auth / verification backend.
// ============================================

export async function verifyPhoneOTP(
  enteredOTP: string
): Promise<PhoneOTPResult> {
  try {
    console.log("[PhoneAuth] Verifying TEST OTP...");

    if (!generatedOTP || !pendingPhone) {
      throw {
        code: "OTP_NOT_FOUND",
        message: "Please request OTP first.",
      };
    }

    if (
      otpExpiresAt &&
      Date.now() > otpExpiresAt
    ) {
      generatedOTP = null;
      otpExpiresAt = null;
      pendingPhone = null;

      console.error("[PhoneAuth] OTP expired.");

      throw {
        code: "OTP_EXPIRED",
        message:
          "OTP has expired. Please request a new OTP.",
      };
    }

    const entered = enteredOTP.trim();

    if (!/^[0-9]{6}$/.test(entered)) {
      throw {
        code: "INVALID_OTP",
        message:
          "Please enter a valid 6-digit OTP.",
      };
    }

    if (entered !== generatedOTP) {
      console.error(
        "[PhoneAuth] Invalid OTP entered:",
        entered
      );

      throw {
        code: "INVALID_OTP",
        message:
          "Invalid OTP. Please check the OTP and try again.",
      };
    }

    // ==========================================
    // OTP IS CORRECT
    // ==========================================

    const verifiedPhone = pendingPhone;

    console.log(
      "[PhoneAuth] OTP verified successfully."
    );

    // ==========================================
    // CREATE / KEEP FIREBASE AUTH SESSION
    // ==========================================

    let firebaseUser = auth.currentUser;

    if (!firebaseUser) {
      console.log(
        "[PhoneAuth] Creating Firebase test auth user..."
      );

      const credential = await signInAnonymously(auth);

      firebaseUser = credential.user;
    } else {
      console.log(
        "[PhoneAuth] Firebase user already exists:",
        firebaseUser.uid
      );
    }

    if (!firebaseUser) {
      throw {
        code: "FIREBASE_AUTH_FAILED",
        message:
          "OTP was verified, but Firebase authentication failed.",
      };
    }

    console.log(
      "[PhoneAuth] Firebase Auth UID:",
      firebaseUser.uid
    );

    // ==========================================
    // SAVE PHONE PROFILE DATA
    // ==========================================

    // Do NOT block login on Firestore.
    // Authentication has already succeeded, so the user must be
    // allowed to continue to Index even if Firestore is slow/offline.
    void setDoc(
      doc(db, "users", firebaseUser.uid),
      {
        phone: verifiedPhone,
        authProvider: "phone-test",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
      .then(() => {
        console.log(
          "[PhoneAuth] Phone profile saved:",
          verifiedPhone
        );
      })
      .catch((firestoreError: any) => {
        console.error(
          "[PhoneAuth] Phone profile save failed:",
          firestoreError?.code,
          firestoreError?.message
        );
      });

    // Clear OTP immediately after Firebase Auth succeeds.
    generatedOTP = null;
    otpExpiresAt = null;
    pendingPhone = null;

    console.log(
      "[PhoneAuth] TEST OTP login completed successfully."
    );

    return {
      success: true,
      phone: verifiedPhone,
      uid: firebaseUser.uid,
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

// ============================================
// OPTIONAL: CLEAR OTP
// ============================================

export function clearPhoneOTP(): void {
  generatedOTP = null;
  otpExpiresAt = null;
  pendingPhone = null;

  console.log(
    "[PhoneAuth] TEST OTP cleared."
  );
}