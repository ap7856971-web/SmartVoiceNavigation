import {
  getAuth,
  signInWithPhoneNumber,
} from "@react-native-firebase/auth";


// =====================================================
// FIREBASE AUTH
// =====================================================

const auth = getAuth();


// =====================================================
// DEBUG FIREBASE CONFIG
// =====================================================

console.log(
  "[PhoneAuth] Firebase app name:",
  auth.app.name
);

console.log(
  "[PhoneAuth] Firebase projectId:",
  auth.app.options.projectId
);

console.log(
  "[PhoneAuth] Firebase appId:",
  auth.app.options.appId
);

console.log(
  "[PhoneAuth] Firebase messagingSenderId:",
  auth.app.options.messagingSenderId
);


// =====================================================
// CONFIRMATION RESULT
// =====================================================

let confirmationResult:
  Awaited<
    ReturnType<
      typeof signInWithPhoneNumber
    >
  > | null = null;


// =====================================================
// FORMAT INDIAN PHONE
// =====================================================

function formatIndianPhone(
  phoneNumber: string
): string {

  const input =
    phoneNumber.trim();

  const digits =
    input.replace(/\D/g, "");


  // +91XXXXXXXXXX

  if (
    input.startsWith("+91") &&
    digits.length >= 12
  ) {
    return `+91${digits.slice(-10)}`;
  }


  // 91XXXXXXXXXX

  if (
    digits.startsWith("91") &&
    digits.length === 12
  ) {
    return `+${digits}`;
  }


  // XXXXXXXXXX

  if (
    digits.length === 10
  ) {
    return `+91${digits}`;
  }


  throw new Error(
    "Valid 10 digit Indian mobile number enter karo."
  );
}


// =====================================================
// SEND REAL OTP
// =====================================================

export async function sendPhoneOTP(
  phoneNumber: string
): Promise<void> {

  if (
    !phoneNumber?.trim()
  ) {
    throw new Error(
      "Phone number enter karo."
    );
  }


  const formattedPhone =
    formatIndianPhone(
      phoneNumber
    );


  console.log(
    "[PhoneAuth] Sending REAL OTP:",
    formattedPhone
  );


  // ---------------------------------------------------
  // Runtime Firebase configuration
  // ---------------------------------------------------

  console.log(
    "[PhoneAuth] Runtime Firebase project:",
    auth.app.options.projectId
  );

  console.log(
    "[PhoneAuth] Runtime Firebase appId:",
    auth.app.options.appId
  );


  // ---------------------------------------------------
  // Safety check
  // ---------------------------------------------------

  if (
    auth.app.options.projectId !==
    "smartvoicenavigation"
  ) {

    console.error(
      "[PhoneAuth] WRONG FIREBASE PROJECT:",
      auth.app.options.projectId
    );

    throw new Error(
      `Wrong Firebase project loaded: ${auth.app.options.projectId}`
    );
  }


  try {

    confirmationResult =
      await signInWithPhoneNumber(
        auth,
        formattedPhone
      );


    console.log(
      "[PhoneAuth] REAL OTP sent successfully"
    );

  } catch (
    error: any
  ) {

    confirmationResult =
      null;


    console.error(
      "[PhoneAuth] Send OTP error code:",
      error?.code
    );

    console.error(
      "[PhoneAuth] Send OTP error message:",
      error?.message
    );

    console.error(
      "[PhoneAuth] Full Firebase error:",
      error
    );


    switch (
      error?.code
    ) {

      case "auth/invalid-phone-number":

        throw new Error(
          "Invalid mobile number."
        );


      case "auth/too-many-requests":

        throw new Error(
          "Too many OTP requests. Please try again later."
        );


      case "auth/quota-exceeded":

        throw new Error(
          "Firebase SMS quota exceeded. Please try again later."
        );


      case "auth/operation-not-allowed":

        throw new Error(
          "Phone Authentication is not enabled in Firebase Console."
        );


      case "auth/app-not-authorized":

        throw new Error(
          "Android app is not authorized in Firebase. Check SHA-1/SHA-256 and google-services.json."
        );


      case "auth/invalid-app-credential":

        throw new Error(
          "Firebase Android app credential is invalid. Check google-services.json and SHA-1/SHA-256."
        );


      case "auth/network-request-failed":

        throw new Error(
          "Network error. Check your internet connection and try again."
        );


      case "auth/internal-error":

        throw new Error(
          "Firebase internal error. Check Firebase project configuration and Identity Toolkit API."
        );


      default:

        throw new Error(
          error?.message ||
            "Failed to send OTP."
        );
    }
  }
}


// =====================================================
// VERIFY REAL OTP
// =====================================================

export async function verifyPhoneOTP(
  otp: string
) {

  if (
    !confirmationResult
  ) {

    throw new Error(
      "Pehle OTP send karo."
    );
  }


  const code =
    otp
      .trim()
      .replace(/\D/g, "");


  if (
    !/^\d{6}$/.test(code)
  ) {

    throw new Error(
      "6 digit OTP enter karo."
    );
  }


  console.log(
    "[PhoneAuth] Verifying REAL OTP..."
  );


  try {

    const result =
      await confirmationResult.confirm(
        code
      );


    confirmationResult =
      null;


    console.log(
      "[PhoneAuth] Verification successful:",
      result.user.uid
    );


    return result.user;

  } catch (
    error: any
  ) {

    console.error(
      "[PhoneAuth] Verify error code:",
      error?.code
    );

    console.error(
      "[PhoneAuth] Verify error message:",
      error?.message
    );


    if (
      error?.code ===
      "auth/invalid-verification-code"
    ) {

      throw new Error(
        "Incorrect OTP. Please enter the OTP received by SMS."
      );
    }


    if (
      error?.code ===
      "auth/code-expired"
    ) {

      confirmationResult =
        null;


      throw new Error(
        "OTP expired. Please request a new OTP."
      );
    }


    throw new Error(
      error?.message ||
        "OTP verification failed."
    );
  }
}


// =====================================================
// LOGOUT
// =====================================================

export async function logoutPhoneUser() {

  try {

    await auth.signOut();

    confirmationResult =
      null;


    console.log(
      "[PhoneAuth] Logged out successfully"
    );

  } catch (
    error
  ) {

    console.error(
      "[PhoneAuth] Logout error:",
      error
    );

    throw error;
  }
}


// =====================================================
// GET CURRENT USER
// =====================================================

export function getPhoneUser() {

  return auth.currentUser;
}


// =====================================================
// CHECK OTP
// =====================================================

export function isOTPAvailable() {

  return (
    confirmationResult !== null
  );
}