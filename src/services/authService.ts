import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  updateEmail,
} from "firebase/auth";

import { auth } from "../firebase";

// ==================================================
// 1. REGISTER USER
// ==================================================


export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  const userCredential =
    await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

  await updateProfile(userCredential.user, {
    displayName: name.trim(),
  });

  return userCredential.user;
}

// ==================================================
// 2. LOGIN USER
// ==================================================

export async function loginUser(
  email: string,
  password: string
) {
  const userCredential =
    await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

  return userCredential.user;
}

// ==================================================
// 3. FORGOT PASSWORD
// ==================================================

export async function forgotPassword(
  email: string
) {
  await sendPasswordResetEmail(
    auth,
    email.trim()
  );
}

// ==================================================
// 4. LOGOUT USER
// ==================================================

export async function logoutUser() {
  await signOut(auth);
}

// ==================================================
// 5. UPDATE USER PROFILE
// Name + Photo
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

  await updateProfile(user, {
    displayName: name.trim(),
    photoURL:
      photoURL?.trim() || user.photoURL || null,
  });

  return user;
}

// ==================================================
// 6. UPDATE EMAIL
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

  const email = newEmail.trim();

  if (!email) {
    throw new Error(
      "Email address cannot be empty."
    );
  }

  if (email === user.email) {
    return user;
  }

  await updateEmail(user, email);

  return user;
}

// ==================================================
// 7. GET CURRENT USER
// ==================================================

export function getCurrentUser() {
  return auth.currentUser;
}

// ==================================================
// 8. CHECK LOGIN STATUS
// ==================================================

export function isUserLoggedIn() {
  return !!auth.currentUser;
}