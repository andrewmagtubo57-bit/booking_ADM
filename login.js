import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const termsInput = document.getElementById("terms");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const termsError = document.getElementById("termsError");
const message = document.getElementById("formMessage");
const loginButton = document.getElementById("loginButton");

function clearErrors() {
  emailError.textContent = "";
  passwordError.textContent = "";
  termsError.textContent = "";
  emailInput.setAttribute("aria-invalid", "false");
  passwordInput.setAttribute("aria-invalid", "false");
  message.textContent = "";
  message.className = "form-message";
}

function setMessage(text, type = "error") {
  message.textContent = text;
  message.className = `form-message ${type}-message`;
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  clearErrors();

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  let valid = true;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailError.textContent = "Enter the email address you registered with.";
    emailInput.setAttribute("aria-invalid", "true");
    valid = false;
  }
  if (!password) {
    passwordError.textContent = "Password is required.";
    passwordInput.setAttribute("aria-invalid", "true");
    valid = false;
  }
  if (!termsInput.checked) {
    termsError.textContent = "You must agree to the Terms and Conditions.";
    valid = false;
  }

  if (!valid) {
    setMessage("Please correct the red warnings above.");
    const first = form.querySelector('[aria-invalid="true"]') ||
      (!termsInput.checked ? termsInput : null);
    first?.scrollIntoView({ behavior: "smooth", block: "center" });
    first?.focus({ preventScroll: true });
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = "Logging in...";

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    setMessage(`Login successful! Welcome${credential.user.displayName ? ", " + credential.user.displayName : ""}.`, "success");
    sessionStorage.setItem("loggedInUid", credential.user.uid);
    setTimeout(() => { window.location.href = "home.html"; }, 900);
  } catch (error) {
    console.error("Login error:", error);
    const code = error?.code || "";
    const errors = {
      "auth/invalid-credential": "Incorrect email or password.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/user-disabled": "This account has been disabled.",
      "auth/too-many-requests": "Too many attempts. Wait a while and try again.",
      "auth/network-request-failed": "Network error. Check your internet connection."
    };
    setMessage(errors[code] || "Login failed. Check your email, password, and Firebase setup.");
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Login";
  }
});

// Show / hide password toggle
document.querySelectorAll(".toggle-password").forEach(button => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.target);
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    button.setAttribute("aria-pressed", String(show));
    button.setAttribute("aria-label", show ? "Hide password" : "Show password");
  });
});

document.getElementById("createAccountButton").addEventListener("click", () => {
  window.location.href = "register.html";
});