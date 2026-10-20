// ASIC-Skill Supabase authentication
// Requires:
// 1. @supabase/supabase-js v2
// 2. supabase-config.js containing `supabaseClient`

function showMessage(text, type = "info") {
  const box = document.getElementById("auth-message");
  if (!box) return;

  box.textContent = text;
  box.className = "auth-message " + type;
  box.hidden = false;
}

function pageUrl(filename) {
  return new URL(filename, window.location.href).href;
}

// -------------------- SIGN UP --------------------
async function signUp(event) {
  event.preventDefault();

  const fullName = document.getElementById("full-name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  if (password !== confirmPassword) {
    showMessage("Passwords do not match.", "error");
    return;
  }

  showMessage("Creating your ASIC-Skill account...", "info");

  // ?verified=true is intentionally included in the redirect.
  // After Supabase verifies the email, signin.html uses it to show
  // the successful verification message.
  const verificationRedirect =
    pageUrl("signin.html?verified=true");

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      },
      emailRedirectTo: verificationRedirect
    }
  });

  if (error) {
    showMessage(error.message, "error");
    return;
  }

  if (data.session) {
    showMessage(
      "Account created successfully. You are already signed in.",
      "success"
    );
    return;
  }

  showMessage(
    "Account created! Please check your email and click the verification link.",
    "success"
  );
}

// -------------------- SIGN IN --------------------
async function signIn(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  showMessage("Signing in...", "info");

  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    showMessage(error.message, "error");
    return;
  }

  if (data.session) {
    showMessage("Signed in successfully. Redirecting...", "success");

    setTimeout(() => {
      const requestedNext = new URLSearchParams(window.location.search).get("next") || "";
      const safeNext = /^eda-lab\.html(?:\?.*)?$/.test(requestedNext)
        ? requestedNext
        : "index.html";
      window.location.href = safeNext;
    }, 700);
  }
}

// -------------------- VERIFICATION MESSAGE --------------------
function checkVerificationMessage() {
  const params = new URLSearchParams(window.location.search);

  if (params.get("verified") === "true") {
    showMessage(
      "✓ Email verification done successfully! Your ASIC-Skill account is active. Please sign in.",
      "success"
    );

    // Keep the message visible but remove ?verified=true from the address bar.
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );
  }
}

// -------------------- FORGOT PASSWORD --------------------
async function sendPasswordReset(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();

  if (!email) {
    showMessage(
      "Enter your email address first, then click Forgot password.",
      "error"
    );
    return;
  }

  showMessage("Sending password reset email...", "info");

  const { error } =
    await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: pageUrl("reset-password.html")
    });

  if (error) {
    showMessage(error.message, "error");
    return;
  }

  showMessage(
    "Password reset email sent. Please check your inbox.",
    "success"
  );
}


// -------------------- UPDATE PASSWORD --------------------
async function updatePassword(event) {
  event.preventDefault();

  const newPassword = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-new-password").value;

  if (newPassword.length < 8) {
    showMessage("Password must contain at least 8 characters.", "error");
    return;
  }

  if (newPassword !== confirmPassword) {
    showMessage("Passwords do not match.", "error");
    return;
  }

  showMessage("Updating your password...", "info");

  const { error } = await supabaseClient.auth.updateUser({
    password: newPassword
  });

  if (error) {
    showMessage("Unable to update password: " + error.message, "error");
    return;
  }

  showMessage("✓ Password changed successfully! Redirecting to Sign In...", "success");
  await supabaseClient.auth.signOut();

  setTimeout(() => {
    window.location.href = "signin.html?password_changed=true";
  }, 1500);
}

// -------------------- LOG OUT --------------------
async function signOut() {
  await supabaseClient.auth.signOut();
  window.location.href = "signin.html";
}
// -------------------- DASHBOARD --------------------
async function protectDashboard() {
  const {
    data: { session },
    error
  } = await supabaseClient.auth.getSession();

  // User is not signed in
  if (error || !session) {
    window.location.href = "signin.html";
    return;
  }

  const user = session.user;

  // Read full name saved during signup
  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "ASIC-Skill Learner";

  // Show name
  const nameElement = document.getElementById("user-name");
  if (nameElement) {
    nameElement.textContent = fullName;
  }

  // Show email
  const emailElement = document.getElementById("user-email");
  if (emailElement) {
    emailElement.textContent = user.email || "";
  }
}

// -------------------- WEBSITE USER MENU --------------------
async function initWebsiteUser() {
  const signupLink = document.getElementById("auth-signup-link");
  const userMenu = document.getElementById("user-menu");
  if (!signupLink || !userMenu) return;

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    signupLink.hidden = false;
    userMenu.hidden = true;
    return;
  }

  const user = session.user;
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "ASIC-Skill Learner";
  const firstName = fullName.split(/\s+/)[0] || "Learner";

  signupLink.hidden = true;
  userMenu.hidden = false;
  document.getElementById("nav-user-name").textContent = firstName;
  document.getElementById("menu-user-name").textContent = fullName;
  document.getElementById("menu-user-email").textContent = user.email || "";
  document.getElementById("user-avatar").textContent = firstName.charAt(0).toUpperCase();

  const button = document.getElementById("user-menu-button");
  const dropdown = document.getElementById("user-dropdown");
  button?.addEventListener("click", () => {
    const open = dropdown.hidden;
    dropdown.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
  });

  document.getElementById("nav-logout")?.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
  });

  document.addEventListener("click", (event) => {
    if (!userMenu.contains(event.target)) {
      dropdown.hidden = true;
      button?.setAttribute("aria-expanded", "false");
    }
  });
}

document.addEventListener("DOMContentLoaded", initWebsiteUser);

// ============================================================
// FORGOT PASSWORD UI MODE
// Add this block to auth.js.
// Keep your existing signUp/signIn/reset/update/signOut functions.
// ============================================================

function showForgotPassword() {
  const passwordSection = document.getElementById("password-section");
  const password = document.getElementById("password");
  const signInButton = document.getElementById("signin-button");
  const forgotSection = document.getElementById("forgot-link-section");
  const resetActions = document.getElementById("reset-actions");
  const title = document.getElementById("auth-title");
  const createAccount = document.getElementById("create-account-section");

  if (passwordSection) passwordSection.hidden = true;
  if (password) password.required = false;
  if (signInButton) signInButton.hidden = true;
  if (forgotSection) forgotSection.hidden = true;
  if (resetActions) resetActions.hidden = false;
  if (title) title.textContent = "Forgot password";
  if (createAccount) createAccount.hidden = true;

  showMessage(
    "Enter your registered email address and we'll send you a password reset link.",
    "info"
  );

  document.getElementById("email")?.focus();
}

function showSignIn() {
  const passwordSection = document.getElementById("password-section");
  const password = document.getElementById("password");
  const signInButton = document.getElementById("signin-button");
  const forgotSection = document.getElementById("forgot-link-section");
  const resetActions = document.getElementById("reset-actions");
  const title = document.getElementById("auth-title");
  const createAccount = document.getElementById("create-account-section");
  const message = document.getElementById("auth-message");

  if (passwordSection) passwordSection.hidden = false;
  if (password) password.required = true;
  if (signInButton) signInButton.hidden = false;
  if (forgotSection) forgotSection.hidden = false;
  if (resetActions) resetActions.hidden = true;
  if (title) title.textContent = "Sign in";
  if (createAccount) createAccount.hidden = false;
  if (message) message.hidden = true;
}



// -------------------- SHOW / HIDE PASSWORD --------------------
function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input || !button) return;

  const showing = input.type === "text";
  input.type = showing ? "password" : "text";
  button.setAttribute("aria-label", showing ? "Show password" : "Hide password");
  button.setAttribute("aria-pressed", String(!showing));
  button.classList.toggle("is-visible", !showing);
}
