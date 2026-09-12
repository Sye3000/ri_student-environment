/* =========================================================
   RI STUDENT ENVIRONMENT — ADMIN PORTAL
   ========================================================= */

const API_BASE_URL = "http://192.168.122.10:3000";

const token = localStorage.getItem("ri_student_token");

let currentAdmin = null;
let pendingEvents = [];
let students = [];
let rejectingEventId = null;


/* =========================================================
   INITIALISE
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    initialiseAdmin();

    setupNavigation();
    setupMobileMenu();
    setupLogout();
    setupRefreshButtons();
    setupRejectModal();

});


/* =========================================================
   ADMIN AUTHENTICATION
   ========================================================= */

async function initialiseAdmin() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/auth/me`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Authentication failed.");
        }

        const data = await response.json();

        console.log("Admin authentication:", data);

        const student =
            data.student ||
            data.user ||
            data.data;

        if (!student) {
            throw new Error("Unable to identify logged-in user.");
        }

        if (student.role !== "admin") {

            alert("Administrator access required.");

            window.location.href = "dashboard.html";

            return;
        }

        currentAdmin = student;

        populateAdminIdentity(student);

        await loadAdminData();

    } catch (error) {

        console.error(
            "Admin authentication error:",
            error
        );

        localStorage.removeItem("ri_student_token");
        localStorage.removeItem("ri_student");

        window.location.href = "login.html";
    }
}


/* =========================================================
   ADMIN IDENTITY
   ========================================================= */

function populateAdminIdentity(student) {

    const name =
        student.full_name ||
        student.name ||
        "Administrator";

    const initial =
        name.trim().charAt(0).toUpperCase() ||
        "A";

    const headerInitial =
        document.getElementById("adminHeaderInitial");

    const headerName =
        document.getElementById("adminHeaderName");

    const headerRole =
        document.getElementById("adminHeaderRole");

    const welcomeName =
        document.getElementById("adminWelcomeName");


    if (headerInitial) {
        headerInitial.textContent = initial;
    }

    if (headerName) {
        headerName.textContent = name;
    }

    if (headerRole) {
        headerRole.textContent = "Administrator";
    }

    if (welcomeName) {
        welcomeName.textContent = name;
    }
}


/* =========================================================
   LOAD ADMIN DATA
   ========================================================= */

async function loadAdminData() {

    await Promise.all([
        loadStudents(),
        loadPendingEvents()
    ]);

    updateStatistics();
}


/* =========================================================
   STUDENTS
   ========================================================= */

async function loadStudents() {

    const tableBody =
        document.getElementById("studentsTableBody");

    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="admin-table-message">
                    Loading students...
                </td>
            </tr>
        `;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/admin/students`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {

            if (response.status === 401) {
                throw new Error("Authentication expired.");
            }

            if (response.status === 403) {
                throw new Error("Administrator access denied.");
            }

            throw new Error(
                `Students request failed: ${response.status}`
            );
        }

        const data = await response.json();

        console.log("Students API:", data);

        students = data.students || [];

        renderStudents();

    } catch (error) {

        console.error(
            "Failed to load students:",
            error
        );

        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="admin-table-message">
                        Unable to load students.
                    </td>
                </tr>
            `;
        }
    }
}


/* =========================================================
   RENDER STUDENTS
   ========================================================= */

function renderStudents() {

    const tableBody =
        document.getElementById("studentsTableBody");

    if (!tableBody) return;

    if (!students.length) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="admin-table-message">
                    No student accounts found.
                </td>
            </tr>
        `;

        return;
    }


    tableBody.innerHTML = students.map(student => {

        const isAdmin =
            student.role === "admin";

        const isActive =
            student.account_status === "active";


        const actionButton =
            isAdmin

                ? `
                    <span class="admin-status-badge admin-status-admin">
                        Administrator
                    </span>
                  `

                : isActive

                    ? `
                        <button
                            type="button"
                            class="admin-danger-button"
                            onclick="changeStudentStatus(
                                ${student.student_id},
                                'suspended'
                            )"
                        >
                            Suspend
                        </button>
                      `

                    : `
                        <button
                            type="button"
                            class="admin-primary-button"
                            onclick="changeStudentStatus(
                                ${student.student_id},
                                'active'
                            )"
                        >
                            Reactivate
                        </button>
                      `;


        return `
            <tr>

                <td>

                    <div class="admin-student-name">

                        <strong>
                            ${escapeHtml(
                                student.full_name || "Unknown"
                            )}
                        </strong>

                        <span>
                            ${escapeHtml(
                                student.student_number || "—"
                            )}
                        </span>

                    </div>

                </td>


                <td>
                    ${escapeHtml(
                        student.email || "—"
                    )}
                </td>


                <td>

                    ${escapeHtml(
                        student.campus_name || "—"
                    )}

                    <div style="
                        margin-top:3px;
                        font-size:10px;
                        color:var(--admin-text-muted);
                    ">
                        ${escapeHtml(
                            student.campus_code || ""
                        )}
                    </div>

                </td>


                <td>

                    ${
                        isAdmin

                            ? `
                                <span class="admin-status-badge admin-status-admin">
                                    Admin
                                </span>
                              `

                            : `
                                <span class="admin-status-badge admin-status-student">
                                    Student
                                </span>
                              `
                    }

                </td>


                <td>

                    ${
                        isActive

                            ? `
                                <span class="admin-status-badge admin-status-active">
                                    Active
                                </span>
                              `

                            : `
                                <span class="admin-status-badge admin-status-suspended">
                                    Suspended
                                </span>
                              `
                    }

                </td>


                <td>
                    ${actionButton}
                </td>

            </tr>
        `;

    }).join("");
}


/* =========================================================
   CHANGE STUDENT STATUS
   ========================================================= */

async function changeStudentStatus(
    studentId,
    newStatus
) {

    const student =
        students.find(
            item => item.student_id === studentId
        );

    if (!student) return;


    const action =
        newStatus === "suspended"
            ? "suspend"
            : "reactivate";


    const confirmed = confirm(
        `Are you sure you want to ${action} ${student.full_name}?`
    );

    if (!confirmed) return;


    try {

        const response = await fetch(
            `${API_BASE_URL}/api/admin/students/${studentId}/status`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },

                body: JSON.stringify({
                    status: newStatus
                })
            }
        );


        const data = await response.json();

        console.log(
            "Student status response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to update student status."
            );
        }


        alert(
            `Student account ${action}d successfully.`
        );


        await loadStudents();

        updateStatistics();


    } catch (error) {

        console.error(
            "Status update error:",
            error
        );

        alert(
            error.message ||
            "Unable to update student status."
        );
    }
}


/* =========================================================
   EVENTS
   ========================================================= */

async function loadPendingEvents() {

    const containers = [
        document.getElementById(
            "pendingEventsContainer"
        ),

        document.getElementById(
            "overviewEvents"
        )
    ];


    containers.forEach(container => {

        if (container) {

            container.innerHTML = `
                <div class="admin-loading-state">
                    Loading events...
                </div>
            `;
        }

    });


    try {

        const response = await fetch(
            `${API_BASE_URL}/api/events/pending`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );


        if (!response.ok) {

            if (response.status === 401) {
                throw new Error("Authentication expired.");
            }

            if (response.status === 403) {
                throw new Error("Administrator access denied.");
            }

            throw new Error(
                `Events request failed: ${response.status}`
            );
        }


        const data = await response.json();

        console.log(
            "Pending events API:",
            data
        );


        pendingEvents =
            data.events || [];


        renderPendingEvents();

        updatePendingEventBadge();


    } catch (error) {

        console.error(
            "Failed to load pending events:",
            error
        );


        containers.forEach(container => {

            if (container) {

                container.innerHTML = `
                    <div class="admin-empty-state">
                        <strong>
                            Unable to load events
                        </strong>

                        <span>
                            ${escapeHtml(error.message)}
                        </span>
                    </div>
                `;
            }

        });
    }
}


/* =========================================================
   RENDER PENDING EVENTS
   ========================================================= */

function renderPendingEvents() {

    const fullContainer =
        document.getElementById(
            "pendingEventsContainer"
        );

    const overviewContainer =
        document.getElementById(
            "overviewEvents"
        );


    if (!pendingEvents.length) {

        const emptyHtml = `
            <div class="admin-empty-state">

                <strong>
                    No pending events
                </strong>

                <span>
                    There are currently no events
                    awaiting approval.
                </span>

            </div>
        `;


        if (fullContainer) {
            fullContainer.innerHTML = emptyHtml;
        }

        if (overviewContainer) {
            overviewContainer.innerHTML = emptyHtml;
        }

        return;
    }


    if (fullContainer) {

        fullContainer.innerHTML =
            pendingEvents
                .map(event => createEventHtml(
                    event,
                    true
                ))
                .join("");
    }


    if (overviewContainer) {

        overviewContainer.innerHTML =
            pendingEvents
                .slice(0, 3)
                .map(event => createEventHtml(
                    event,
                    true
                ))
                .join("");
    }
}


/* =========================================================
   EVENT CARD
   ========================================================= */

function createEventHtml(
    event,
    includeActions = true
) {

    const date =
        formatEventDate(event.event_date);

    const time =
        formatEventTime(
            event.start_time,
            event.end_time
        );


    const submittedBy =
        event.src_full_name ||
        event.full_name ||
        event.student_name ||
        "SRC Member";


    const campus =
        event.campus_name ||
        event.campus_code ||
        "Campus";


    return `
        <article class="admin-event-item">

            <div class="admin-event-top">

                <div>

                    <h3 class="admin-event-title">
                        ${escapeHtml(
                            event.title ||
                            "Untitled Event"
                        )}
                    </h3>

                    <p class="admin-event-description">
                        ${escapeHtml(
                            event.description ||
                            "No description provided."
                        )}
                    </p>

                </div>

            </div>


            <div class="admin-event-meta">

                <span>
                    <strong>Date:</strong>
                    ${escapeHtml(date)}
                </span>

                ${
                    time
                        ? `
                            <span>
                                <strong>Time:</strong>
                                ${escapeHtml(time)}
                            </span>
                          `
                        : ""
                }

                <span>
                    <strong>Location:</strong>
                    ${escapeHtml(
                        event.location ||
                        "Not specified"
                    )}
                </span>

                <span>
                    <strong>Campus:</strong>
                    ${escapeHtml(campus)}
                </span>

                <span>
                    <strong>Submitted by:</strong>
                    ${escapeHtml(submittedBy)}
                </span>

            </div>


            ${
                includeActions

                    ? `
                        <div class="admin-event-actions">

                            <button
                                type="button"
                                class="admin-primary-button"
                                onclick="approveEvent(
                                    ${event.event_id}
                                )"
                            >
                                Approve
                            </button>


                            <button
                                type="button"
                                class="admin-danger-button"
                                onclick="openRejectModal(
                                    ${event.event_id}
                                )"
                            >
                                Reject
                            </button>

                        </div>
                      `

                    : ""
            }

        </article>
    `;
}


/* =========================================================
   APPROVE EVENT
   ========================================================= */

async function approveEvent(eventId) {

    const event =
        pendingEvents.find(
            item => item.event_id === eventId
        );

    if (!event) return;


    const confirmed = confirm(
        `Approve "${event.title}"?`
    );

    if (!confirmed) return;


    try {

        const response = await fetch(
            `${API_BASE_URL}/api/events/${eventId}/approve`,
            {
                method: "PUT",

                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );


        const data = await response.json();

        console.log(
            "Approve event response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to approve event."
            );
        }


        alert("Event approved successfully.");


        await loadPendingEvents();

        updateStatistics();


    } catch (error) {

        console.error(
            "Approve event error:",
            error
        );

        alert(
            error.message ||
            "Unable to approve event."
        );
    }
}


/* =========================================================
   REJECT MODAL
   ========================================================= */

function setupRejectModal() {

    const closeButton =
        document.getElementById(
            "closeRejectModal"
        );

    const cancelButton =
        document.getElementById(
            "cancelRejectButton"
        );

    const backdrop =
        document.getElementById(
            "rejectModalBackdrop"
        );

    const confirmButton =
        document.getElementById(
            "confirmRejectButton"
        );


    closeButton?.addEventListener(
        "click",
        closeRejectModal
    );

    cancelButton?.addEventListener(
        "click",
        closeRejectModal
    );

    backdrop?.addEventListener(
        "click",
        closeRejectModal
    );

    confirmButton?.addEventListener(
        "click",
        rejectEvent
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {
                closeRejectModal();
            }

        }
    );
}


/* =========================================================
   OPEN REJECT MODAL
   ========================================================= */

function openRejectModal(eventId) {

    rejectingEventId = eventId;


    const modal =
        document.getElementById(
            "rejectEventModal"
        );

    const reason =
        document.getElementById(
            "rejectReason"
        );

    const error =
        document.getElementById(
            "rejectReasonError"
        );


    if (reason) {
        reason.value = "";
    }

    if (error) {
        error.textContent = "";
    }

    if (modal) {

        modal.classList.add("open");

        modal.setAttribute(
            "aria-hidden",
            "false"
        );
    }


    reason?.focus();
}


/* =========================================================
   CLOSE REJECT MODAL
   ========================================================= */

function closeRejectModal() {

    rejectingEventId = null;


    const modal =
        document.getElementById(
            "rejectEventModal"
        );


    if (modal) {

        modal.classList.remove("open");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );
    }
}


/* =========================================================
   REJECT EVENT
   ========================================================= */

async function rejectEvent() {

    if (!rejectingEventId) return;


    const reasonInput =
        document.getElementById(
            "rejectReason"
        );

    const errorElement =
        document.getElementById(
            "rejectReasonError"
        );


    const reason =
        reasonInput?.value.trim() || "";


    if (!reason) {

        if (errorElement) {
            errorElement.textContent =
                "Please provide a rejection reason.";
        }

        reasonInput?.focus();

        return;
    }


    try {

        const response = await fetch(
            `${API_BASE_URL}/api/events/${rejectingEventId}/reject`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },

                body: JSON.stringify({
                    admin_comment: reason
                })
            }
        );


        const data = await response.json();


        console.log(
            "Reject event response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to reject event."
            );
        }


        closeRejectModal();


        alert(
            "Event rejected successfully."
        );


        await loadPendingEvents();

        updateStatistics();


    } catch (error) {

        console.error(
            "Reject event error:",
            error
        );


        if (errorElement) {

            errorElement.textContent =
                error.message ||
                "Unable to reject event.";
        }
    }
}


/* =========================================================
   STATISTICS
   ========================================================= */

function updateStatistics() {

    const total =
        students.length;

    const active =
        students.filter(
            student =>
                student.account_status === "active"
        ).length;

    const suspended =
        students.filter(
            student =>
                student.account_status === "suspended"
        ).length;

    const pending =
        pendingEvents.length;


    setText(
        "totalStudents",
        total
    );

    setText(
        "totalActiveStudents",
        active
    );

    setText(
        "totalSuspendedStudents",
        suspended
    );

    setText(
        "totalPendingEvents",
        pending
    );


    setText(
        "summaryStudents",
        total
    );

    setText(
        "summaryActive",
        active
    );

    setText(
        "summarySuspended",
        suspended
    );

    setText(
        "summaryPendingEvents",
        pending
    );
}


/* =========================================================
   PENDING EVENT BADGE
   ========================================================= */

function updatePendingEventBadge() {

    const badge =
        document.getElementById(
            "pendingEventBadge"
        );


    if (!badge) return;


    badge.textContent =
        pendingEvents.length;


    badge.style.display =
        pendingEvents.length > 0
            ? "inline-flex"
            : "none";
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    const links =
        document.querySelectorAll(
            ".admin-nav-link[data-section]"
        );


    links.forEach(link => {

        link.addEventListener(
            "click",
            event => {

                event.preventDefault();

                const section =
                    link.dataset.section;

                showSection(section);

                closeMobileSidebar();

            }
        );

    });


    const sectionButtons =
        document.querySelectorAll(
            "[data-section-target]"
        );


    sectionButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                showSection(
                    button.dataset.sectionTarget
                );

                closeMobileSidebar();

            }
        );

    });


    handleInitialSection();
}


/* =========================================================
   SHOW SECTION
   ========================================================= */

function showSection(section) {

    const sections =
        document.querySelectorAll(
            ".admin-section"
        );


    sections.forEach(element => {

        element.classList.remove(
            "active"
        );

    });


    const target =
        document.getElementById(
            `${section}Section`
        );


    if (target) {

        target.classList.add(
            "active"
        );
    }


    const links =
        document.querySelectorAll(
            ".admin-nav-link[data-section]"
        );


    links.forEach(link => {

        link.classList.toggle(
            "active",
            link.dataset.section === section
        );

    });


    history.replaceState(
        null,
        "",
        `#${section}`
    );
}


/* =========================================================
   INITIAL SECTION
   ========================================================= */

function handleInitialSection() {

    const hash =
        window.location.hash.replace(
            "#",
            ""
        );


    if (
        hash === "events" ||
        hash === "students" ||
        hash === "overview"
    ) {

        showSection(hash);

    } else {

        showSection("overview");

    }
}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function setupMobileMenu() {

    const menuButton =
        document.getElementById(
            "adminMenuButton"
        );

    const sidebar =
        document.getElementById(
            "adminSidebar"
        );

    const overlay =
        document.getElementById(
            "adminSidebarOverlay"
        );


    if (!menuButton || !sidebar) {
        return;
    }


    menuButton.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

            overlay?.classList.toggle(
                "open"
            );

        }
    );


    overlay?.addEventListener(
        "click",
        closeMobileSidebar
    );
}


function closeMobileSidebar() {

    const sidebar =
        document.getElementById(
            "adminSidebar"
        );

    const overlay =
        document.getElementById(
            "adminSidebarOverlay"
        );


    sidebar?.classList.remove(
        "open"
    );

    overlay?.classList.remove(
        "open"
    );
}


/* =========================================================
   REFRESH BUTTONS
   ========================================================= */

function setupRefreshButtons() {

    document
        .getElementById(
            "refreshEventsButton"
        )
        ?.addEventListener(
            "click",
            async () => {

                await loadPendingEvents();

                updateStatistics();

            }
        );


    document
        .getElementById(
            "refreshStudentsButton"
        )
        ?.addEventListener(
            "click",
            async () => {

                await loadStudents();

                updateStatistics();

            }
        );
}


/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogout() {

    const logout =
        document.getElementById(
            "adminLogoutLink"
        );


    logout?.addEventListener(
        "click",
        event => {

            event.preventDefault();


            localStorage.removeItem(
                "ri_student_token"
            );

            localStorage.removeItem(
                "ri_student"
            );


            window.location.href =
                "login.html";

        }
    );
}


/* =========================================================
   DATE / TIME HELPERS
   ========================================================= */

function formatEventDate(dateValue) {

    if (!dateValue) {
        return "Date not specified";
    }


    const date =
        new Date(
            `${dateValue}T00:00:00`
        );


    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }


    return date.toLocaleDateString(
        "en-ZA",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function formatEventTime(
    startTime,
    endTime
) {

    if (!startTime) {
        return "";
    }


    const format =
        value =>
            value
                .toString()
                .slice(0, 5);


    if (endTime) {

        return `${format(startTime)} – ${format(endTime)}`;

    }


    return format(startTime);
}


/* =========================================================
   SECURITY / HTML ESCAPING
   ========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   DOM HELPER
   ========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}
