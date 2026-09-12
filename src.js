// =====================================================
// RI STUDENT ENVIRONMENT
// SRC MEMBERS
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    const srcGrid = document.getElementById("src-members-grid");

    if (!srcGrid) {
        console.error("SRC members container not found.");
        return;
    }

    const token = localStorage.getItem("ri_student_token");

    // -------------------------------------------------
    // NOT LOGGED IN
    // -------------------------------------------------

    if (!token) {

        srcGrid.innerHTML = `
            <div class="src-empty-state">
                <h3>View Your Campus SRC</h3>

                <p>
                    Please log in to view the verified Student
                    Representative Council members for your campus.
                </p>

                <a href="login.html" class="src-contact">
                    Log In
                    <span aria-hidden="true">→</span>
                </a>
            </div>
        `;

        return;
    }

    // -------------------------------------------------
    // LOAD VERIFIED SRC MEMBERS
    // -------------------------------------------------

    loadSrcMembers(token);


    async function loadSrcMembers(token) {

        try {

            const response = await fetch(
                `${window.RI_API_URL || "http://192.168.122.10:3000"}/api/src/members`,
                {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const data = await response.json();

            // -----------------------------------------
            // AUTHENTICATION FAILURE
            // -----------------------------------------

            if (response.status === 401 || response.status === 403) {

                localStorage.removeItem("ri_student_token");
                localStorage.removeItem("ri_student");

                srcGrid.innerHTML = `
                    <div class="src-empty-state">
                        <h3>Session Expired</h3>

                        <p>
                            Your login session has expired.
                            Please log in again to view your campus SRC.
                        </p>

                        <a href="login.html" class="src-contact">
                            Log In Again
                            <span aria-hidden="true">→</span>
                        </a>
                    </div>
                `;

                return;
            }

            // -----------------------------------------
            // API ERROR
            // -----------------------------------------

            if (!response.ok || data.status !== "success") {

                throw new Error(
                    data.message || "Unable to load SRC members."
                );

            }

            const members = Array.isArray(data.members)
                ? data.members
                : [];

            // -----------------------------------------
            // NO SRC MEMBERS
            // -----------------------------------------

            if (members.length === 0) {

                srcGrid.innerHTML = `
                    <div class="src-empty-state">

                        <h3>No SRC Members Listed Yet</h3>

                        <p>
                            There are currently no verified SRC members
                            listed for your campus.
                        </p>

                    </div>
                `;

                return;
            }

            // -----------------------------------------
            // DISPLAY VERIFIED SRC MEMBERS
            // -----------------------------------------

            srcGrid.innerHTML = members.map(member => {

                const position =
                    member.position || "SRC Member";

                const fullName =
                    member.full_name || "SRC Representative";

                const campusName =
                    member.campus_name || "Your Campus";

                const bio =
                    member.bio ||
                    getDefaultDescription(position);

                const profilePicture =
                    member.profile_picture ||
                    getDefaultImage(position);

                return `
                    <article class="src-card">

                        <div class="src-photo">

                            <img
                                src="${escapeHtml(profilePicture)}"
                                alt="${escapeHtml(fullName)}"
                                loading="lazy"
                                onerror="this.src='President.jpeg'"
                            >

                        </div>

                        <div class="src-card-content">

                            <p class="src-position">
                                ${escapeHtml(position)}
                            </p>

                            <h3>
                                ${escapeHtml(fullName)}
                            </h3>

                            <p class="src-campus">
                                ${escapeHtml(campusName)}
                            </p>

                            <p>
                                ${escapeHtml(bio)}
                            </p>

                            <a
                                href="login.html"
                                class="src-contact"
                            >
                                View Profile
                                <span aria-hidden="true">→</span>
                            </a>

                        </div>

                    </article>
                `;

            }).join("");

        } catch (error) {

            console.error("SRC members error:", error);

            srcGrid.innerHTML = `
                <div class="src-empty-state">

                    <h3>Unable to Load SRC</h3>

                    <p>
                        We could not load your campus SRC members
                        right now. Please try again later.
                    </p>

                </div>
            `;

        }

    }


    // -------------------------------------------------
    // DEFAULT DESCRIPTIONS
    // -------------------------------------------------

    function getDefaultDescription(position) {

        const normalized =
            position.toLowerCase();

        if (normalized.includes("president")) {
            return "Responsible for student leadership, representation, and coordination of SRC activities.";
        }

        if (normalized.includes("deputy")) {
            return "Supports the SRC President and assists with student representation and initiatives.";
        }

        if (normalized.includes("secretary")) {
            return "Coordinates SRC communication, meetings, documentation, and student information.";
        }

        if (normalized.includes("treasurer")) {
            return "Supports responsible management of SRC resources and student initiatives.";
        }

        return "Represents students and contributes to campus student leadership and initiatives.";

    }


    // -------------------------------------------------
    // DEFAULT IMAGES
    // -------------------------------------------------

    function getDefaultImage(position) {

        const normalized =
            position.toLowerCase();

        if (normalized.includes("deputy")) {
            return "Deputy President.jpeg";
        }

        if (normalized.includes("secretary")) {
            return "Secretary.jpeg";
        }

        if (normalized.includes("treasurer")) {
            return "Treasure.jpeg";
        }

        return "President.jpeg";

    }


    // -------------------------------------------------
    // BASIC HTML ESCAPING
    // -------------------------------------------------

    function escapeHtml(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }

});
