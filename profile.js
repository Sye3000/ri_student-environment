/* =========================================================
   RI STUDENT ENVIRONMENT
   PROFILE PAGE
   Real backend integration
   ========================================================= */

(function () {
    "use strict";

    /* =====================================================
       STATE
       ===================================================== */

    let currentProfile = null;


    /* =====================================================
       DOM HELPERS
       ===================================================== */

    function byId(id) {
        return document.getElementById(id);
    }


    /* =====================================================
       AUTH HEADER
       ===================================================== */

    function authHeaders() {
        const token = getToken();

        if (!token) {
            throw new Error("Your session has expired. Please log in again.");
        }

        return {
            Authorization: `Bearer ${token}`
        };
    }


    /* =====================================================
       MESSAGE
       ===================================================== */

    function showMessage(message, type = "info") {
        const element = byId("profile-message");

        if (!element) return;

        element.textContent = message;
        element.className = `profile-message ${type}`;
        element.hidden = false;

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    function hideMessage() {
        const element = byId("profile-message");

        if (!element) return;

        element.hidden = true;
        element.textContent = "";
        element.className = "profile-message";
    }


    /* =====================================================
       TEXT HELPERS
       ===================================================== */

    function safeText(value, fallback = "—") {
        if (value === null || value === undefined || value === "") {
            return fallback;
        }

        return String(value);
    }


    function formatRole(role) {
        const roles = {
            student: "Student",
            src: "SRC Member",
            admin: "Administrator"
        };

        return roles[role] || role || "Student";
    }


    function formatStatus(status) {
        if (!status) return "Unknown";

        return String(status)
            .replace(/_/g, " ")
            .replace(/\b\w/g, letter => letter.toUpperCase());
    }


    function getInitials(fullName) {
        const name = safeText(fullName, "Student").trim();

        const parts = name
            .split(/\s+/)
            .filter(Boolean);

        if (parts.length === 0) {
            return "ST";
        }

        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
        }

        return (
            parts[0].charAt(0) +
            parts[parts.length - 1].charAt(0)
        ).toUpperCase();
    }


    /* =====================================================
       PROFILE IMAGE URL
       ===================================================== */

    function getProfileImageUrl(profilePicture) {
        if (!profilePicture) {
            return null;
        }

        if (
            profilePicture.startsWith("http://") ||
            profilePicture.startsWith("https://")
        ) {
            return profilePicture;
        }

        const baseUrl = RI_CONFIG.API_BASE_URL.replace(/\/$/, "");

        if (profilePicture.startsWith("/")) {
            return `${baseUrl}${profilePicture}`;
        }

        return `${baseUrl}/${profilePicture}`;
    }


    /* =====================================================
       AVATAR
       ===================================================== */

    function renderAvatar(profile) {
        const avatar = byId("profile-avatar");
        const initials = byId("profile-avatar-initials");

        if (!avatar) return;

        const imageUrl = getProfileImageUrl(profile.profile_picture);

        if (imageUrl) {

            avatar.innerHTML = "";

            const image = document.createElement("img");

            image.src = imageUrl;
            image.alt = `${safeText(profile.full_name)} profile picture`;

            image.onerror = function () {
                avatar.innerHTML = "";
                avatar.appendChild(
                    createInitialsElement(
                        getInitials(profile.full_name)
                    )
                );
            };

            avatar.appendChild(image);

            return;
        }

        if (initials) {
            initials.textContent = getInitials(profile.full_name);
        } else {
            avatar.textContent = getInitials(profile.full_name);
        }
    }


    function createInitialsElement(value) {
        const span = document.createElement("span");

        span.id = "profile-avatar-initials";
        span.textContent = value;

        return span;
    }


    /* =====================================================
       STATUS CLASS
       ===================================================== */

    function statusClass(status) {
        const normalized = String(status || "").toLowerCase();

        if (
            normalized === "active" ||
            normalized === "approved" ||
            normalized === "verified"
        ) {
            return "success";
        }

        if (
            normalized === "suspended" ||
            normalized === "blocked" ||
            normalized === "inactive" ||
            normalized === "disabled"
        ) {
            return "danger";
        }

        return "warning";
    }


    /* =====================================================
       RENDER PROFILE
       ===================================================== */

    function renderProfile(profile) {
        currentProfile = profile;

        const fullName = safeText(profile.full_name, "Student");
        const email = safeText(profile.email);
        const studentNumber = safeText(profile.student_number);
        const role = formatRole(profile.role);

        const campusName = safeText(profile.campus_name);
        const campusCode = safeText(profile.campus_code);
        const city = safeText(profile.city);

        const accountStatus = formatStatus(profile.account_status);

        /* Hero */
        byId("profile-full-name").textContent = fullName;
        byId("profile-email").textContent = email;
        byId("profile-role-label").textContent = role;
        byId("profile-campus-summary").textContent =
            `${campusName}${city !== "—" ? ` · ${city}` : ""}`;

        /* Status */
        const statusBadge = byId("profile-account-status");

        statusBadge.textContent = accountStatus;
        statusBadge.className =
            `profile-status-badge ${statusClass(profile.account_status)}`;

        /* Form */
        byId("profile-name-input").value = fullName;
        byId("profile-email-input").value = email;
        byId("profile-student-number-input").value = studentNumber;
        byId("profile-bio-input").value = safeText(profile.bio, "");

        updateBioCount();

        /* View mode */
        byId("profile-view-name").textContent = fullName;
        byId("profile-view-email").textContent = email;
        byId("profile-view-student-number").textContent = studentNumber;

        const viewBio = byId("profile-view-bio");
        const bio = safeText(profile.bio, "").trim();

        if (bio) {
            viewBio.textContent = bio;
            viewBio.classList.remove("empty");
        } else {
            viewBio.textContent = "No bio has been added yet.";
            viewBio.classList.add("empty");
        }

        /* Always return to view mode after profile data loads */
        setEditMode(false);

        /* Student details */
        byId("profile-student-number").textContent = studentNumber;
        byId("profile-detail-name").textContent = fullName;
        byId("profile-detail-email").textContent = email;
        byId("profile-role").textContent = role;

        /* Campus */
        byId("profile-campus-name").textContent = campusName;
        byId("profile-campus-code").textContent = campusCode;
        byId("profile-campus-city").textContent = city;

        /* Account */
        const accountStatusLarge =
            byId("profile-account-status-large");

        accountStatusLarge.textContent = accountStatus;
        accountStatusLarge.className =
            `profile-status-large ${statusClass(profile.account_status)}`;

        /* Avatar */
        renderAvatar(profile);
    }


    /* =====================================================
       LOAD PROFILE
       ===================================================== */

    async function loadProfile() {
        const main = document.querySelector(".profile-main");

        try {
            hideMessage();

            if (!getToken()) {
                window.location.href = "login.html";
                return;
            }

            if (main) {
                main.classList.add("profile-loading");
            }

            const data = await RI_API.get(
                "/api/students/profile",
                {
                    headers: authHeaders()
                }
            );

            if (!data || !data.profile) {
                throw new Error(
                    "The server returned incomplete profile information."
                );
            }

            renderProfile(data.profile);

        } catch (error) {

            console.error(
                "PROFILE: Unable to load profile.",
                error
            );

            if (
                error.message &&
                (
                    error.message.includes("401") ||
                    error.message.toLowerCase().includes("expired") ||
                    error.message.toLowerCase().includes("unauthorized")
                )
            ) {
                clearAuthentication();
                window.location.href = "login.html";
                return;
            }

            showMessage(
                error.message ||
                "Unable to load your profile.",
                "error"
            );

        } finally {

            if (main) {
                main.classList.remove("profile-loading");
            }
        }
    }


    /* =====================================================
       EDIT MODE
       ===================================================== */

    function setEditMode(enabled) {
        const viewMode = byId("profile-view-mode");
        const editMode = byId("profile-form");
        const editButton = byId("profile-edit-button");

        if (!viewMode || !editMode || !editButton) {
            return;
        }

        if (enabled) {
            viewMode.hidden = true;
            editMode.hidden = false;

            editButton.hidden = true;

            byId("profile-name-input").focus();

            return;
        }

        viewMode.hidden = false;
        editMode.hidden = true;

        editButton.hidden = false;
    }


    /* =====================================================
       EDIT PROFILE
       ===================================================== */

    function startEditing() {
        if (!currentProfile) {
            return;
        }

        hideMessage();

        /* Load the latest saved values into the form */
        byId("profile-name-input").value =
            safeText(currentProfile.full_name, "");

        byId("profile-bio-input").value =
            safeText(currentProfile.bio, "");

        updateBioCount();

        setEditMode(true);
    }


    /* =====================================================
       CANCEL EDITING
       ===================================================== */

    function cancelEditing() {
        if (!currentProfile) {
            setEditMode(false);
            return;
        }

        byId("profile-name-input").value =
            safeText(currentProfile.full_name, "");

        byId("profile-bio-input").value =
            safeText(currentProfile.bio, "");

        updateBioCount();

        hideMessage();

        setEditMode(false);
    }


    /* =====================================================
       SAVE PROFILE
       ===================================================== */

    async function saveProfile(event) {
        event.preventDefault();

        const saveButton = byId("profile-save-button");

        const fullName =
            byId("profile-name-input").value.trim();

        const bio =
            byId("profile-bio-input").value.trim();

        if (fullName.length < 2) {
            showMessage(
                "Please enter a valid full name.",
                "error"
            );

            byId("profile-name-input").focus();

            return;
        }

        if (bio.length > 1000) {
            showMessage(
                "Your bio cannot exceed 1000 characters.",
                "error"
            );

            return;
        }

        try {

            hideMessage();

            saveButton.disabled = true;
            saveButton.textContent = "Saving...";

            const data = await RI_API.put(
                "/api/students/profile",
                {
                    full_name: fullName,
                    bio: bio
                },
                {
                    headers: authHeaders()
                }
            );

            if (!data || !data.profile) {
                throw new Error(
                    "The server did not return the updated profile."
                );
            }

            renderProfile(data.profile);

            setEditMode(false);

            showMessage(
                "Your profile has been updated successfully.",
                "success"
            );

        } catch (error) {

            console.error(
                "PROFILE: Unable to save profile.",
                error
            );

            showMessage(
                error.message ||
                "Unable to save your profile.",
                "error"
            );

        } finally {

            saveButton.disabled = false;
            saveButton.textContent = "Save Changes";
        }
    }


    /* =====================================================
       RESET FORM
       ===================================================== */

    function resetForm() {
        cancelEditing();
    }


    /* =====================================================
       BIO COUNTER
       ===================================================== */

    function updateBioCount() {
        const textarea = byId("profile-bio-input");
        const counter = byId("profile-bio-count");

        if (!textarea || !counter) return;

        counter.textContent =
            `${textarea.value.length} / 1000`;
    }


    /* =====================================================
       PROFILE PICTURE UPLOAD
       ===================================================== */

    async function uploadProfilePicture(event) {
        const file =
            event.target.files && event.target.files[0];

        if (!file) {
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            showMessage(
                "Please select a JPG, PNG or WEBP image.",
                "error"
            );

            event.target.value = "";

            return;
        }

        const maxSize = 5 * 1024 * 1024;

        if (file.size > maxSize) {
            showMessage(
                "The profile picture must be 5MB or smaller.",
                "error"
            );

            event.target.value = "";

            return;
        }

        try {

            hideMessage();

            showMessage(
                "Uploading your profile picture...",
                "info"
            );

            const formData = new FormData();

            formData.append("picture", file);

            const data = await RI_API.post(
                "/api/students/profile/picture",
                formData,
                {
                    headers: authHeaders()
                }
            );

            if (!data || !data.profile_picture) {
                throw new Error(
                    "The server did not return the uploaded image."
                );
            }

            if (currentProfile) {
                currentProfile.profile_picture =
                    data.profile_picture;

                renderAvatar(currentProfile);
            }

            showMessage(
                "Your profile picture has been updated successfully.",
                "success"
            );

        } catch (error) {

            console.error(
                "PROFILE: Picture upload failed.",
                error
            );

            showMessage(
                error.message ||
                "Unable to upload your profile picture.",
                "error"
            );

        } finally {

            event.target.value = "";
        }
    }


    /* =====================================================
       EVENT LISTENERS
       ===================================================== */

    function initialiseEvents() {

        const form = byId("profile-form");

        if (form) {
            form.addEventListener(
                "submit",
                saveProfile
            );
        }


        const editButton =
            byId("profile-edit-button");

        if (editButton) {
            editButton.addEventListener(
                "click",
                startEditing
            );
        }


        const resetButton =
            byId("profile-cancel-button");

        if (resetButton) {
            resetButton.addEventListener(
                "click",
                cancelEditing
            );
        }


        const bio =
            byId("profile-bio-input");

        if (bio) {
            bio.addEventListener(
                "input",
                updateBioCount
            );
        }


        const avatarInput =
            byId("profile-avatar-input");

        if (avatarInput) {
            avatarInput.addEventListener(
                "change",
                uploadProfilePicture
            );
        }
    }


    /* =====================================================
       INITIALISE
       ===================================================== */

    async function initialiseProfilePage() {

        console.log(
            "PROFILE: Initialising RI profile page..."
        );

        initialiseEvents();

        await loadProfile();

        console.log(
            "PROFILE: Initialisation complete."
        );
    }


    document.addEventListener(
        "DOMContentLoaded",
        initialiseProfilePage
    );

})();
