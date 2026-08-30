/* =========================================================
   RI STUDENT ENVIRONMENT
   Frontend Application JavaScript
   ========================================================= */

   const API_BASE_URL = window.RI_API_BASE_URL || "http://192.168.122.10:3000";

/* =========================================================
   API REQUEST HELPER
   ========================================================= */

async function apiRequest(endpoint, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let response;

    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            },
            ...options,
            signal: options.signal || controller.signal
        });
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error("The server took too long to respond.");
        }

        throw new Error("Unable to connect to the server.");
    } finally {
        clearTimeout(timeout);
    }

    let data;

    try {
        data = await response.json();
    } catch {
        data = {
            status: "error",
            message: "Invalid server response"
        };
    }

    if (!response.ok) {
        throw new Error(data.message || "Request failed");
    }

    return data;
}


/* =========================================================
   AUTH TOKEN
   ========================================================= */

function getToken() {
    return localStorage.getItem("ri_student_token");
}


function saveToken(token) {
    localStorage.setItem("ri_student_token", token);
}


function removeToken() {
    localStorage.removeItem("ri_student_token");
}


/* =========================================================
   STUDENT DATA
   ========================================================= */

function saveStudent(student) {
    localStorage.setItem(
        "ri_student",
        JSON.stringify(student)
    );
}


function getSavedStudent() {
    const student = localStorage.getItem("ri_student");

    if (!student) {
        return null;
    }

    try {
        return JSON.parse(student);
    } catch {
        return null;
    }
}


/* =========================================================
   REGISTRATION
   ========================================================= */

async function loadCampuses() {
    const campusSelect = document.getElementById("campus");

    if (!campusSelect) {
        return;
    }

    try {
        const data = await apiRequest("/api/campuses");

        campusSelect.innerHTML = `
            <option value="" selected disabled>
                Select your campus
            </option>
        `;

        if (!Array.isArray(data.campuses)) {
            throw new Error("Invalid campus response");
        }

        data.campuses.forEach(campus => {
            const option = document.createElement("option");

            option.value = campus.campus_id;

            option.textContent =
                `${campus.campus_name} - ${campus.city}`;

            campusSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Campus loading error:", error);

        campusSelect.innerHTML = `
            <option value="" selected disabled>
                Unable to load campuses
            </option>
        `;
    }
}


async function handleRegistration(event) {
    event.preventDefault();

    const form = event.target;

    const fullName =
        document.getElementById("full-name").value.trim();

    const studentNumber =
        document.getElementById("student-number").value.trim();

    const email =
        document.getElementById("student-email").value.trim();

    const campusId =
        document.getElementById("campus").value;

    const password =
        document.getElementById("password").value;

    const confirmPassword =
        document.getElementById("confirm-password").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    if (password.length < 8) {
        alert("Password must be at least 8 characters long.");
        return;
    }

    const button =
        form.querySelector('button[type="submit"]');

    button.disabled = true;
    button.textContent = "Creating Account...";

    try {
        const data = await apiRequest(
            "/api/students/register",
            {
                method: "POST",
                body: JSON.stringify({
                    student_number: studentNumber,
                    full_name: fullName,
                    email: email,
                    password: password,
                    campus_id: Number(campusId)
                })
            }
        );

        alert(
            data.message ||
            "Registration successful. You can now log in."
        );

        window.location.href = "login.html";

    } catch (error) {
        alert(error.message);
    } finally {
        button.disabled = false;
        button.textContent = "Join Us";
    }
}


/* =========================================================
   LOGIN
   ========================================================= */

async function handleLogin(event) {
    event.preventDefault();

    const form = event.target;

    const email =
        document.getElementById("student-email").value.trim();

    const password =
        document.getElementById("password").value;

    const button =
        form.querySelector('button[type="submit"]');

    button.disabled = true;
    button.textContent = "Signing In...";

    try {
        const data = await apiRequest(
            "/api/students/login",
            {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        if (!data.token || !data.student) {
            throw new Error("The server returned an incomplete login response.");
        }

        saveToken(data.token);
        saveStudent(data.student);

        window.location.href = "dashboard.html";

    } catch (error) {
        alert(error.message);
    } finally {
        button.disabled = false;
        button.textContent = "Login";
    }
}


/* =========================================================
   CONTACT
   ========================================================= */

async function handleContact(event) {
    event.preventDefault();

    const form = event.target;
    const button = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const status = document.createElement("p");

    status.className = "form-status";
    status.setAttribute("role", "status");
    form.appendChild(status);
    button.disabled = true;
    button.textContent = "Sending...";

    try {
        const data = await apiRequest(
            "/api/contact",
            {
                method: "POST",
                body: JSON.stringify({
                    full_name: formData.get("full-name"),
                    email: formData.get("email"),
                    subject: formData.get("subject"),
                    message: formData.get("message")
                })
            }
        );

        status.textContent = data.message || "Your message was sent successfully.";
        status.classList.add("form-status-success");
        form.reset();
    } catch (error) {
        status.textContent = error.message;
        status.classList.add("form-status-error");
    } finally {
        button.disabled = false;
        button.textContent = "Send Message";
    }
}


async function handleForgotPassword(event) {
    event.preventDefault();

    const email = window.prompt("Enter your student email address:");

    if (!email || !email.trim()) {
        return;
    }

    try {
        const data = await apiRequest(
            "/api/students/forgot-password",
            {
                method: "POST",
                body: JSON.stringify({ email: email.trim() })
            }
        );

        alert(data.message || "If that account exists, reset instructions have been sent.");
    } catch (error) {
        alert(error.message);
    }
}


/* =========================================================
   AUTHENTICATED STUDENT
   ========================================================= */

async function loadCurrentStudent() {
    const token = getToken();

    if (!token) {
        window.location.href = "login.html";
        return null;
    }

    try {
        const data = await apiRequest(
            "/api/auth/me",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!data.student) {
            throw new Error("The server returned incomplete student data.");
        }

        saveStudent(data.student);

        return data.student;

    } catch (error) {
        console.error("Authentication error:", error);

        removeToken();
        localStorage.removeItem("ri_student");

        window.location.href = "login.html";

        return null;
    }
}


/* =========================================================
   DASHBOARD
   ========================================================= */

async function initialiseDashboard() {
    const student = await loadCurrentStudent();

    if (!student) {
        return;
    }

    const nameElement =
        document.getElementById("student-name");

    if (nameElement) {
        nameElement.textContent = student.full_name;
    }

    const numberElement =
        document.getElementById("student-number-display");

    if (numberElement) {
        numberElement.textContent =
            student.student_number;
    }

    const emailElement =
        document.getElementById("student-email-display");

    if (emailElement) {
        emailElement.textContent =
            student.email;
    }

    const roleElement =
        document.getElementById("student-role");

    if (roleElement) {
        roleElement.textContent =
            student.role || "Student";
    }
}
/* =========================================================
   PROFILE
   ========================================================= */

async function initialiseProfile() {

    const token = getToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {

        const data = await apiRequest(
            "/api/students/profile",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const profile = data.profile;

        if (!profile || typeof profile !== "object") {
            throw new Error("The server returned incomplete profile data.");
        }

        document.getElementById("profile-full-name").textContent =
            profile.full_name || "Not available";

        document.getElementById("profile-student-number").textContent =
            profile.student_number || "Not available";

        document.getElementById("profile-email").textContent =
            profile.email || "Not available";

        document.getElementById("profile-role").textContent =
            profile.role || "Student";

        document.getElementById("profile-campus").textContent =
            profile.campus_name || "Not available";

        document.getElementById("profile-campus-code").textContent =
            profile.campus_code || "Not available";

        document.getElementById("profile-city").textContent =
            profile.city || "Not available";

        const statusLabels = {
            active: "Active",
            pending: "Pending review",
            suspended: "Temporarily suspended"
        };

        const accountStatus = String(
            profile.account_status || "Not available"
        );

        document.getElementById("profile-status").textContent =
            statusLabels[accountStatus.toLowerCase()] || accountStatus;

    } catch (error) {

        console.error("Profile loading error:", error);

        const errorElement = document.getElementById("profile-error");

        if (errorElement) {
            errorElement.hidden = false;
        }

    }
}
    /* Profile */

    if (
        document.body.classList.contains(
            "profile-page"
        )
    ) {
        initialiseProfile();
    }

/* =========================================================
   LOGOUT
   ========================================================= */

function logoutStudent(event) {
    if (event) {
        event.preventDefault();
    }

    removeToken();
    localStorage.removeItem("ri_student");

    window.location.href = "index.html";
}


/* =========================================================
   PAGE INITIALISATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* Registration page */

    const registrationForm =
        document.querySelector(".join-form");

    if (registrationForm) {
        loadCampuses();

        registrationForm.addEventListener(
            "submit",
            handleRegistration
        );
    }


    /* Login page */

    const loginForm =
        document.querySelector(".login-form");

    if (loginForm) {
        loginForm.addEventListener(
            "submit",
            handleLogin
        );
    }


    /* Contact page */

    const contactForm =
        document.querySelector(".contact-form form");

    if (contactForm) {
        contactForm.addEventListener(
            "submit",
            handleContact
        );
    }


    /* Password recovery */

    const forgotPasswordLink =
        document.querySelector(".forgot-password-link");

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener(
            "click",
            handleForgotPassword
        );
    }


    /* Dashboard */

    if (
        document.body.classList.contains("dashboard-page") &&
        !document.body.classList.contains("profile-page")
    ) {
        initialiseDashboard();
    }


    /* Logout */

    const logoutButton =
        document.querySelector(".logout-button");

    if (logoutButton) {
        logoutButton.addEventListener(
            "click",
            logoutStudent
        );
    }

});
/* =====================================
   STUDENT WALLET
===================================== */

const walletKey = "storeWallet";

let studentWallet =
    parseFloat(localStorage.getItem(walletKey)) || 1000;


/* Display wallet balance */

function updateWalletDisplay() {

    const walletElement =
        document.getElementById("student-wallet-balance");

    if (!walletElement) return;

    walletElement.textContent =
        studentWallet.toFixed(2);
}


/* Add funds */

function addFunds() {

    const amount =
        prompt("Enter the amount you want to add to your student account:");

    if (amount === null) return;

    const value =
        parseFloat(amount);

    if (isNaN(value) || value <= 0) {

        alert("Please enter a valid amount.");

        return;
    }

    studentWallet += value;

    localStorage.setItem(
        walletKey,
        studentWallet.toFixed(2)
    );

    updateWalletDisplay();

    alert(
        "R" +
        value.toFixed(2) +
        " has been added to your student account."
    );
}


/* =====================================
   PROFILE DISPLAY
===================================== */

function updateProfileHero() {

    const name =
        document.getElementById("profile-full-name")?.textContent;

    const studentNumber =
        document.getElementById("profile-student-number")?.textContent;

    const role =
        document.getElementById("profile-role")?.textContent;


    if (
        name &&
        name !== "Loading..."
    ) {

        document.getElementById(
            "profile-hero-name"
        ).textContent = name;

    }


    if (
        studentNumber &&
        studentNumber !== "Loading..."
    ) {

        document.getElementById(
            "profile-hero-number"
        ).textContent =
            "Student Number: " + studentNumber;

    }


    if (
        role &&
        role !== "Loading..."
    ) {

        document.getElementById(
            "profile-hero-role"
        ).textContent = role;

    }

}


/* Initialise wallet */

updateWalletDisplay();


/*
   Give the existing profile API
   time to populate the student details,
   then update the profile header.
*/

setTimeout(
    updateProfileHero,
    1000
);
