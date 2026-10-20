import { auth } from "./firebase-config.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const form = document.getElementById("forgotForm");
const emailInput = document.getElementById("email");
const emailError = document.getElementById("emailError");
const message = document.getElementById("formMessage");
const button = document.getElementById("resetButton");

form.addEventListener("submit", async event => {
  event.preventDefault();
  emailError.textContent = "";
  message.textContent = "";
  message.className = "form-message";

  const email = emailInput.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailError.textContent = "Enter a valid email address.";
    emailInput.setAttribute("aria-invalid", "true");
    return;
  }
  emailInput.setAttribute("aria-invalid", "false");
  button.disabled = true;
  button.textContent = "Sending...";

  try {
    await sendPasswordResetEmail(auth, email);
    message.textContent = "If this email belongs to an account, a reset link will be sent.";
    message.className = "form-message success-message";
  } catch (error) {
    console.error("Password reset error:", error);
    message.textContent = error?.code === "auth/invalid-email"
      ? "Please enter a valid email address."
      : "Could not send the reset email. Check the address, connection, and Firebase settings.";
    message.className = "form-message error-message";
  } finally {
    button.disabled = false;
    button.textContent = "Send Reset Email";
  }
});
