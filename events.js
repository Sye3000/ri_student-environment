/* =========================================================
   RI STUDENT ENVIRONMENT
   EVENTS PAGE
   ========================================================= */

const EVENTS_API_URL = "http://192.168.122.10:3000";

document.addEventListener("DOMContentLoaded", () => {
    loadEvents();
});


/* =========================================================
   LOAD APPROVED EVENTS
   ========================================================= */

async function loadEvents() {

    const eventsList = document.getElementById("events-list");

    if (!eventsList) {
        return;
    }

    const token =
        localStorage.getItem("ri_student_token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    eventsList.innerHTML = `
        <div class="dashboard-empty-state">
            <div class="dashboard-loading-line"></div>
            <div class="dashboard-loading-line short"></div>
        </div>
    `;

    try {

        const response = await fetch(
            `${EVENTS_API_URL}/api/events`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        console.log("Events API:", data);

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to load events."
            );
        }

        const events = Array.isArray(data.events)
            ? data.events
            : [];

        renderEvents(events);

    } catch (error) {

        console.error(
            "Events loading error:",
            error
        );

        eventsList.innerHTML = `
            <div class="event-empty-message">
                <h3>Unable to load events</h3>
                <p>
                    We could not connect to the events service.
                    Please try again.
                </p>
            </div>
        `;
    }
}


/* =========================================================
   RENDER EVENTS
   ========================================================= */

function renderEvents(events) {

    const eventsList =
        document.getElementById("events-list");

    if (!eventsList) {
        return;
    }

    if (events.length === 0) {

        eventsList.innerHTML = `
            <div class="event-empty-message">
                <h3>No upcoming events</h3>
                <p>
                    There are currently no approved events
                    available for your campus.
                </p>
            </div>
        `;

        return;
    }

    eventsList.innerHTML =
        events.map(createEventCard).join("");
}


/* =========================================================
   CREATE EVENT CARD
   ========================================================= */

function createEventCard(event) {

    const date = parseEventDate(
        event.event_date
    );

    const month =
        date.toLocaleDateString("en-US", {
            month: "short"
        }).toUpperCase();

    const day =
        date.toLocaleDateString("en-US", {
            day: "2-digit"
        });

    const title =
        escapeHtml(
            event.title || "Untitled Event"
        );

    const description =
        escapeHtml(
            event.description || "No description available."
        );

    const location =
        escapeHtml(
            event.location || "Campus"
        );

    const campus =
        escapeHtml(
            event.campus_name ||
            event.campus_code ||
            "Campus"
        );

    const category =
        escapeHtml(
            event.category ||
            "STUDENT EVENT"
        );

    const time =
        formatEventTime(
            event.start_time,
            event.end_time
        );

    return `
        <article class="event-ticket">

            <div class="ticket-date-block">
                <span>${month}</span>
                <strong>${day}</strong>
            </div>

            <div class="ticket-body">

                <div class="ticket-meta">
                    <span class="ticket-tag">
                        ${category}
                    </span>

                    <span class="ticket-location">
                        ${location}
                    </span>
                </div>

                <h3>
                    ${title}
                </h3>

                <p>
                    ${description}
                </p>

                <small>
                    ${campus}${time ? ` • ${time}` : ""}
                </small>

            </div>

            <div class="ticket-action">

                <span>
                    Open event
                </span>

                <a href="event.html?id=${event.event_id}">
                    View →
                </a>

            </div>

        </article>
    `;
}


/* =========================================================
   DATE HELPERS
   ========================================================= */

function parseEventDate(value) {

    if (!value) {
        return new Date();
    }

    const parts =
        String(value).split("-");

    if (parts.length === 3) {

        return new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );
    }

    return new Date(value);
}


function formatEventTime(start, end) {

    if (!start) {
        return "";
    }

    const cleanStart =
        String(start).slice(0, 5);

    if (!end) {
        return cleanStart;
    }

    const cleanEnd =
        String(end).slice(0, 5);

    return `${cleanStart} - ${cleanEnd}`;
}


/* =========================================================
   HTML SAFETY
   ========================================================= */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
