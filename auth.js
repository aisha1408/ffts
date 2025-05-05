// auth.js - Handle user authentication
document.addEventListener("DOMContentLoaded", function() {
    // Check if login form exists in the current page
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }
    
    // Check if register form exists in the current page
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", handleRegister);
    }
    
    // Check if user is logged in and update UI accordingly
    checkAuthStatus();
});

// Handle user login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    
    try {
        const response = await fetch("/api/users/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || "Login failed");
        }
        
        // Save user data to localStorage
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Redirect to home page
        window.location.href = "index.html";
        
    } catch (error) {
        displayError("login-error", error.message);
    }
}

// Handle user registration
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById("register-username").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const confirmPassword = document.getElementById("register-confirm-password").value;
    
    // Client-side validation
    if (password !== confirmPassword) {
        displayError("register-error", "Passwords do not match");
        return;
    }
    
    try {
        const response = await fetch("/api/users/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || "Registration failed");
        }
        
        // Show success message
        displaySuccess("register-success", "Registration successful! Please login.");
        
        // Clear the form
        document.getElementById("register-form").reset();
        
        // Optionally redirect to login page after a delay
        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);
        
    } catch (error) {
        displayError("register-error", error.message);
    }
}

// Check if user is logged in
function checkAuthStatus() {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    
    if (user) {
        // User is logged in
        updateUIForLoggedInUser(user);
    } else {
        // User is not logged in
        updateUIForLoggedOutUser();
    }
}

// Update UI elements based on login status
function updateUIForLoggedInUser(user) {
    // Update all auth-dependent elements on the page
    const authLinks = document.getElementById("auth-links");
    if (authLinks) {
        authLinks.innerHTML = `
            <span>Welcome, ${user.username}!</span>
            <a href="saved-recipes.html">My Saved Recipes</a>
            <a href="profile.html">Profile</a>
            <a href="#" id="logout-link">Logout</a>
        `;
        
        // Add logout functionality
        document.getElementById("logout-link").addEventListener("click", (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    // Show elements that should only be visible to logged in users
    document.querySelectorAll(".logged-in-only").forEach(el => {
        el.style.display = "block";
    });
    
    // Hide elements that should only be visible to logged out users
    document.querySelectorAll(".logged-out-only").forEach(el => {
        el.style.display = "none";
    });
}

// Update UI for logged out users
function updateUIForLoggedOutUser() {
    const authLinks = document.getElementById("auth-links");
    if (authLinks) {
        authLinks.innerHTML = `
            <a href="login.html">Login</a>
            <a href="register.html">Register</a>
        `;
    }
    
    // Hide elements that should only be visible to logged in users
    document.querySelectorAll(".logged-in-only").forEach(el => {
        el.style.display = "none";
    });
    
    // Show elements that should only be visible to logged out users
    document.querySelectorAll(".logged-out-only").forEach(el => {
        el.style.display = "block";
    });
}

// Handle logout
function logout() {
    // Clear user data from localStorage
    localStorage.removeItem("user");
    
    // Update UI
    updateUIForLoggedOutUser();
    
    // Redirect to home page
    window.location.href = "index.html";
}

// Display error message
function displayError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = "block";
        
        // Hide the error message after 5 seconds
        setTimeout(() => {
            errorElement.style.display = "none";
        }, 5000);
    }
}

// Display success message
function displaySuccess(elementId, message) {
    const successElement = document.getElementById(elementId);
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = "block";
        
        // Hide the success message after 5 seconds
        setTimeout(() => {
            successElement.style.display = "none";
        }, 5000);
    }
}