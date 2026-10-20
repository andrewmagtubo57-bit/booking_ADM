import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  doc, getDoc, runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const form = document.getElementById("registerForm");
const submitButton = document.getElementById("registerButton");
const message = document.getElementById("formMessage");

const fields = {
  username: document.getElementById("username"),
  email: document.getElementById("email"),
  birthday: document.getElementById("birthday"),
  gender: document.getElementById("gender"),
  password: document.getElementById("password"),
  confirmPassword: document.getElementById("confirmPassword"),
  terms: document.getElementById("terms")
};

const errorIds = {
  username: "usernameError",
  email: "emailError",
  birthday: "birthdayError",
  gender: "genderError",
  password: "passwordError",
  confirmPassword: "confirmPasswordError",
  terms: "termsError"
};

function showError(key, text) {
  const input = fields[key];
  document.getElementById(errorIds[key]).textContent = text;
  if (input && input.type !== "checkbox") {
    input.setAttribute("aria-invalid", text ? "true" : "false");
  }
}

function clearErrors() {
  Object.keys(errorIds).forEach(key => showError(key, ""));
  message.textContent = "";
  message.className = "form-message";
}

function setMessage(text, type = "error") {
  message.textContent = text;
  message.className = `form-message ${type}-message`;
}

function validPassword(password) {
  return password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9\s]/.test(password) &&
    !/\s/.test(password);
}

function firebaseErrorText(error) {
  const code = error?.code || "";
  const known = {
    "auth/email-already-in-use": "That email is already registered. Try logging in.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Choose a stronger password with at least 8 characters.",
    "auth/network-request-failed": "Network error. Check your internet connection and try again.",
    "permission-denied": "Firebase denied access. Check your Firestore security rules.",
    "unavailable": "Firebase is temporarily unavailable. Try again."
  };
  return known[code] || error?.message || "Registration failed. Please try again.";
}

// Show / hide password toggles
function setPasswordVisibility(button, visible) {
  const input = document.getElementById(button.dataset.target);
  input.type = visible ? "text" : "password";
  button.setAttribute("aria-pressed", String(visible));
  button.setAttribute("aria-label", visible ? "Hide password" : "Show password");
}

document.querySelectorAll(".toggle-password").forEach(button => {
  button.addEventListener("click", () => {
    const isHidden = document.getElementById(button.dataset.target).type === "password";
    setPasswordVisibility(button, isHidden);
  });
});

form.addEventListener("reset", () => {
  setTimeout(() => {
    clearErrors();
    document.querySelectorAll(".toggle-password").forEach(b => setPasswordVisibility(b, false));
  }, 0);
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  clearErrors();

  const username = fields.username.value.trim();
  const email = fields.email.value.trim();
  const birthday = fields.birthday.value;
  const gender = fields.gender.value;
  const password = fields.password.value;
  const confirmPassword = fields.confirmPassword.value;
  let valid = true;

  if (!/^[a-zA-Z0-9_]{8,30}$/.test(username)) {
    showError("username", "Username must be 8–30 characters and contain only letters, numbers, or underscores.");
    valid = false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError("email", "Please enter a valid email address.");
    valid = false;
  }
  if (!birthday) {
    showError("birthday", "Birthday is required.");
    valid = false;
  } else {
    const chosen = new Date(`${birthday}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(chosen.getTime()) || chosen > today) {
      showError("birthday", "Enter a valid birthday that is not in the future.");
      valid = false;
    }
  }
  if (!gender) {
    showError("gender", "Please select your gender.");
    valid = false;
  }
  if (!validPassword(password)) {
    showError("password", "Password must meet every requirement listed above.");
    valid = false;
  }
  if (!confirmPassword) {
    showError("confirmPassword", "Please retype your password.");
    valid = false;
  } else if (password !== confirmPassword) {
    showError("confirmPassword", "Passwords do not match.");
    valid = false;
  }
  if (!fields.terms.checked) {
    showError("terms", "You must agree to the Terms and Conditions.");
    valid = false;
  }

  if (!valid) {
    setMessage("Please correct the red warnings above.");
    const firstInvalid = form.querySelector('[aria-invalid="true"]') ||
      (!fields.terms.checked ? fields.terms : null);
    firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
    firstInvalid?.focus({ preventScroll: true });
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Registering...";

  let createdUser = null;
  try {
    // Create the Firebase Authentication account first.
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    createdUser = credential.user;
    await updateProfile(createdUser, { displayName: username });

    // Reserve a unique username and save the user's non-password profile.
    // Passwords are managed by Firebase Authentication and are never stored in Firestore.
    const usernameKey = username.toLowerCase();
    const usernameRef = doc(db, "usernames", usernameKey);
    const profileRef = doc(db, "users", createdUser.uid);

    await runTransaction(db, async transaction => {
      const usernameSnapshot = await transaction.get(usernameRef);
      if (usernameSnapshot.exists()) {
        throw new Error("USERNAME_ALREADY_EXISTS");
      }
      transaction.set(usernameRef, {
        uid: createdUser.uid,
        createdAt: serverTimestamp()
      });
      transaction.set(profileRef, {
        username,
        email,
        birthday,
        gender,
        createdAt: serverTimestamp()
      });
    });

    setMessage("Registration successful! Redirecting to login...", "success");
    form.reset();
    setTimeout(() => { window.location.href = "login.html"; }, 1200);
  } catch (error) {
    console.error("Registration error:", error);

    if (error?.message === "USERNAME_ALREADY_EXISTS") {
      // The Auth account was created before the username reservation.
      // Remove that new account so the user can retry with a different username.
      if (createdUser) {
        try {
          await deleteUser(createdUser);
        } catch (deleteError) {
          console.error("Could not clean up duplicate-username account:", deleteError);
        }
      }
      showError("username", "That username is already taken. Choose another one.");
      setMessage("Please choose a different username and register again.");
    } else if (createdUser) {
      // Auth account may have been created before a profile/username write failed.
      setMessage("Your authentication account was created, but your profile could not be saved. Check Firestore rules and Firebase setup. Do not repeatedly register the same email.");
    } else {
      setMessage(firebaseErrorText(error));
    }
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Register";
  }
});