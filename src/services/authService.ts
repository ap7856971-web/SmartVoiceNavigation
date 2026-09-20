import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  updateEmail,
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase";

// ==================================================
// 1. REGISTER USER
// ==================================================

export async function registerUser(
  name: string,
  email: string,
  password: string,
  phone: string = ""
) {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.trim();

  const userCredential =
    await createUserWithEmailAndPassword(
      auth,
      cleanEmail,
      password
    );

  const user = userCredential.user;

  await updateProfile(user, {
    displayName: cleanName,
  });

  // Keep registration behavior unchanged:
  // profile is fully written before returning.
  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      photoURL: user.photoURL || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    }
  );

  console.log("[Auth] User created successfully");
  console.log("[Auth] UID:", user.uid);
  console.log("[Auth] Profile saved to Firestore");

  return user;
}

// ==================================================
// 2. LOGIN USER - OPTIMIZED
// ==================================================

export async function loginUser(
  email: string,
  password: string
) {
  const cleanEmail = email.trim().toLowerCase();

  console.log(
    "[Auth] Email login started:",
    cleanEmail
  );

  // Only Firebase Authentication blocks the login.
  // Once this succeeds, return the user immediately.
  const userCredential =
    await signInWithEmailAndPassword(
      auth,
      cleanEmail,
      password
    );

  const user = userCredential.user;

  console.log(
    "[Auth] Firebase login successful"
  );
  console.log(
    "[Auth] UID:",
    user.uid
  );

  // IMPORTANT:
  // Do not await Firestore here.
  // The old implementation waited for getDoc() and sometimes setDoc(),
  // making the Login screen appear slow.
  void ensureUserProfile(user);

  return user;
}

// ==================================================
// ENSURE PROFILE - BACKGROUND
// ==================================================

async function ensureUserProfile(user: any) {
  try {
    const userRef = doc(
      db,
      "users",
      user.uid
    );

    const userSnap = await getDoc(
      userRef
    );

    if (userSnap.exists()) {
      console.log(
        "[Auth] Firestore profile already exists."
      );
      return;
    }

    await setDoc(
      userRef,
      {
        uid: user.uid,
        name: user.displayName || "",
        email: user.email || "",
        phone: user.phoneNumber || "",
        photoURL: user.photoURL || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    console.log(
      "[Auth] Missing Firestore profile created."
    );
  } catch (error) {
    // Never turn a successful Firebase login into a failed login
    // because Firestore is slow/offline.
    console.error(
      "[Auth] Background profile sync failed:",
      error
    );
  }
}

// ==================================================
// 3. GET USER PROFILE
// ==================================================

export async function getUserProfile() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "No user is currently signed in."
    );
  }

  const userRef = doc(
    db,
    "users",
    user.uid
  );

  const userSnap = await getDoc(
    userRef
  );

  if (!userSnap.exists()) {
    return null;
  }

  return userSnap.data();
}

// ==================================================
// 4. FORGOT PASSWORD
// ==================================================

export async function forgotPassword(
  email: string
) {
  await sendPasswordResetEmail(
    auth,
    email.trim().toLowerCase()
  );
}

// ==================================================
// 5. LOGOUT USER
// ==================================================

export async function logoutUser() {
  await signOut(auth);
}

// ==================================================
// 6. UPDATE USER PROFILE
// ==================================================

export async function updateUserProfile(
  name: string,
  photoURL?: string
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "No user is currently signed in."
    );
  }

  const cleanName = name.trim();

  const finalPhotoURL =
    photoURL?.trim() ||
    user.photoURL ||
    "";

  await updateProfile(user, {
    displayName: cleanName,
    photoURL: finalPhotoURL || null,
  });

  await setDoc(
    doc(db, "users", user.uid),
    {
      name: cleanName,
      email: user.email || "",
      photoURL: finalPhotoURL,
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    }
  );

  return user;
}

// ==================================================
// 7. UPDATE EMAIL
// ==================================================

export async function updateUserEmail(
  newEmail: string
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "No user is currently signed in."
    );
  }

  const email = newEmail
    .trim()
    .toLowerCase();

  if (!email) {
    throw new Error(
      "Email address cannot be empty."
    );
  }

  if (email === user.email) {
    return user;
  }

  await updateEmail(user, email);

  await setDoc(
    doc(db, "users", user.uid),
    {
      email,
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    }
  );

  return user;
}

// ==================================================
// 8. GET CURRENT USER
// ==================================================

export function getCurrentUser() {
  return auth.currentUser;
}

// ==================================================
// 9. CHECK LOGIN STATUS
// ==================================================

export function isUserLoggedIn() {
  return !!auth.currentUser;
}