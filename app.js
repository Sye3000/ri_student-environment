/* =========================================================
   RI STUDENT ENVIRONMENT
   Frontend Application JavaScript
   ========================================================= */

/* =========================================================
   API REQUEST COMPATIBILITY LAYER
   ========================================================= */

async function apiRequest(endpoint, options = {}) {
    return RI_API.request(endpoint, options);
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
   CONTACT FORM
   ========================================================= */

function addContactEmailLink(status, details) {
    const emailSubject =
        `[RI Student Environment] ${details.messageType}: ${details.subject}`;

    const emailBody = [
        `Name: ${details.name}`,
        `Email: ${details.email}`,
        `Message type: ${details.messageType}`,
        "",
        details.message
    ].join("\n");

    const link = document.createElement("a");
    link.href =
        `mailto:support@ristudentenvironment.co.za?${new URLSearchParams({
            subject: emailSubject,
            body: emailBody
        }).toString()}`;

    link.textContent = "Open your email application to send the message";
    link.className = "form-mail-link";
    status.append(document.createTextNode(" "), link);
}

async function handleContact(event) {
    event.preventDefault();

    const form = event.currentTarget;

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const details = {
        name: String(formData.get("full-name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        subject: String(formData.get("subject") || "").trim(),
        messageType: String(formData.get("message-type") || "").trim(),
        message: String(formData.get("message") || "").trim()
    };

    if (details.name.length < 2 || details.message.length < 20) {
        alert("Please enter a valid name and a message of at least 20 characters.");
        return;
    }

    const button = form.querySelector('button[type="submit"]');
    let status = form.querySelector(".form-status");

    if (!status) {
        status = document.createElement("p");
        status.className = "form-status";
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        form.appendChild(status);
    }

    status.replaceChildren();
    status.classList.remove("form-status-success", "form-status-error");

    button.disabled = true;
    button.textContent = "Preparing...";

    try {
        await apiRequest("/api/contact", {
            method: "POST",
            body: JSON.stringify({
                full_name: details.name,
                email: details.email,
                subject: `[${details.messageType}] ${details.subject}`,
                message: details.message,
                message_type: details.messageType
            })
        });

        status.textContent =
            "The website demo accepted your submission. No email has been sent automatically. Use this link to send it to the RI team:";
        status.classList.add("form-status-success");
    } catch (error) {
        status.textContent =
            "The website could not submit your message automatically. You can still send it directly to the RI team:";
        status.classList.add("form-status-error");
    }

    addContactEmailLink(status, details);

    button.disabled = false;
    button.textContent = "Send Message";
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

    console.log("DASHBOARD: TOKEN READ", token ? "TOKEN EXISTS" : "NO TOKEN");

    if (!token) {
        console.log("DASHBOARD: NO TOKEN, REDIRECTING TO LOGIN");
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
   ROLE-BASED PAGE ACCESS
   ========================================================= */

async function requireRole(requiredRole) {

    const student = await loadCurrentStudent();

    if (!student) {
        return null;
    }

    if (student.role !== requiredRole) {

        if (student.role === "admin") {
            window.location.href = "admin.html";
        } else if (student.role === "src") {
            window.location.href = "src-dashboard.html";
        } else {
            window.location.href = "dashboard.html";
        }

        return null;
    }

    return student;
}
/* =========================================================
   NOTIFICATIONS
   ========================================================= */

async function loadDashboardNotifications() {

    const notificationButton =
        document.querySelector(".lf-icon-button");

    const notificationDot =
        document.querySelector(".lf-notification-dot");

    const notificationPanel =
        document.getElementById("notificationPanel");

    const notificationList =
        document.getElementById("notificationList");

    const notificationSummary =
        document.getElementById("notificationSummary");

    const notificationClose =
        document.getElementById("notificationClose");

    if (
        !notificationButton ||
        !notificationDot ||
        !notificationPanel ||
        !notificationList
    ) {
        return;
    }

    const token = getToken();

    if (!token) {
        return;
    }

    function updateNotificationDot(unreadCount) {

        notificationDot.hidden = unreadCount <= 0;

        notificationButton.setAttribute(
            "aria-label",
            unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
        );
    }

    function formatNotificationTime(dateValue) {

        if (!dateValue) {
            return "";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleString(
            "en-ZA",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );
    }

    function escapeNotificationText(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    async function fetchNotifications() {

        const data = await apiRequest(
            "/api/community/notifications?limit=50",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        updateNotificationDot(
            Number(data.unread_count || 0)
        );

        return data;
    }

    function renderNotifications(data) {

        const notifications =
            Array.isArray(data.notifications)
                ? data.notifications
                : [];

        const unreadCount =
            Number(data.unread_count || 0);

        if (notificationSummary) {

            notificationSummary.textContent =
                unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                    : "No new notifications";
        }

        if (notifications.length === 0) {

            notificationList.innerHTML = `
                <div class="ri-notification-empty">
                    You're all caught up.
                </div>
            `;

            return;
        }

        notificationList.innerHTML =
            notifications.map(notification => {

                const isUnread =
                    !Boolean(notification.is_read);

                return `
                    <button
                        type="button"
                        class="ri-notification-item ${isUnread ? "unread" : ""}"
                        data-notification-id="${Number(notification.notification_id)}"
                    >
                        <span
                            class="ri-notification-item-dot ${isUnread ? "" : "read"}"
                            aria-hidden="true"
                        ></span>

                        <span class="ri-notification-content">

                            <strong>
                                ${escapeNotificationText(notification.title)}
                            </strong>

                            <p>
                                ${escapeNotificationText(notification.message)}
                            </p>

                            <time>
                                ${escapeNotificationText(
                                    formatNotificationTime(notification.created_at)
                                )}
                            </time>

                        </span>
                    </button>
                `;

            }).join("");
    }

    async function markNotificationAsRead(notificationId) {

        await apiRequest(
            `/api/community/notifications/${notificationId}/read`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
    }

    async function refreshNotifications() {

        try {

            const data =
                await fetchNotifications();

            renderNotifications(data);

        } catch (error) {

            console.error(
                "Dashboard notification error:",
                error
            );

            notificationList.innerHTML = `
                <div class="ri-notification-empty">
                    Unable to load notifications.
                </div>
            `;
        }
    }

    async function openNotifications() {

        notificationPanel.hidden = false;
        notificationPanel.setAttribute(
            "aria-hidden",
            "false"
        );

        await refreshNotifications();
    }

    function closeNotifications() {

        notificationPanel.hidden = true;

        notificationPanel.setAttribute(
            "aria-hidden",
            "true"
        );
    }

    notificationButton.addEventListener(
        "click",
        async () => {

            if (notificationPanel.hidden) {
                await openNotifications();
            } else {
                closeNotifications();
            }
        }
    );

    if (notificationClose) {

        notificationClose.addEventListener(
            "click",
            closeNotifications
        );
    }

    notificationList.addEventListener(
        "click",
        async (event) => {

            const notificationItem =
                event.target.closest(
                    ".ri-notification-item"
                );

            if (!notificationItem) {
                return;
            }

            const notificationId =
                Number(
                    notificationItem.dataset.notificationId
                );

            if (!notificationId) {
                return;
            }

            try {

                await markNotificationAsRead(
                    notificationId
                );

                notificationItem.classList.remove(
                    "unread"
                );

                const dot =
                    notificationItem.querySelector(
                        ".ri-notification-item-dot"
                    );

                if (dot) {
                    dot.classList.add("read");
                }

                await refreshNotifications();

            } catch (error) {

                console.error(
                    "Mark notification as read error:",
                    error
                );
            }
        }
    );

    await refreshNotifications();
}
/* =========================================================
   DASHBOARD
   ========================================================= */

async function initialiseDashboard() {
    const student = await requireRole("student");

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
    await loadDashboardNotifications();
    await loadDashboardWallet();
}
/* =========================================================
   DASHBOARD WALLET
   ========================================================= */

async function loadDashboardWallet() {

    const balanceElement =
        document.getElementById("dashboard-wallet-balance");

    if (!balanceElement) {
        return;
    }

    const token = getToken();

    if (!token) {
        return;
    }

    try {

        const data = await apiRequest(
            "/api/wallet",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const wallet =
            data.wallet || data.data || data;

        const balance =
            Number(wallet.balance ?? 0);

        if (!Number.isFinite(balance)) {
            throw new Error("Invalid wallet balance returned by server.");
        }

        balanceElement.textContent =
            `R${balance.toFixed(2)}`;

    } catch (error) {

        console.error(
            "Dashboard wallet error:",
            error
        );

        balanceElement.textContent =
            "Unavailable";
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


function initialiseAuthNavigation() {
    const navActions = document.querySelectorAll(".nav-actions");

    if (!navActions.length) {
        return;
    }

    const token = getToken();

    if (!token) {
        return;
    }

    navActions.forEach((actions) => {
        actions.innerHTML = `
            <a href="dashboard.html" class="login-link">Dashboard</a>
            <a href="profile.html" class="register-btn">Profile</a>
            <a href="index.html" class="auth-logout-link">Logout</a>
        `;

        const logoutLink = actions.querySelector(".auth-logout-link");

        if (logoutLink) {
            logoutLink.addEventListener("click", logoutStudent);
        }
    });
}


/* =========================================================
   PAGE INITIALISATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    if (!document.body.classList.contains("login-page")) {
        initialiseAuthNavigation();
    }

    const registrationForm = document.querySelector(".join-form");

    if (registrationForm) {
        loadCampuses();
        registrationForm.addEventListener("submit", handleRegistration);
    }

    const contactForm = document.querySelector(".contact-form form");

    if (contactForm) {
        contactForm.addEventListener("submit", handleContact);
    }

    const forgotPasswordLink = document.querySelector(".forgot-password-link");

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener("click", handleForgotPassword);
    }

    if (
        document.body.classList.contains("dashboard-v2-page") &&
        !document.body.classList.contains("profile-page")
    ) {
        initialiseDashboard();
    }

    const logoutButton = document.querySelector(".logout-button");

    if (logoutButton) {
        logoutButton.addEventListener("click", logoutStudent);
    }
});




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



/*
   Give the existing profile API
   time to populate the student details,
   then update the profile header.
*/

setTimeout(
    updateProfileHero,
    1000
);
