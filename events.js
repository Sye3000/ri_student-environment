/* =========================================================
   RI STUDENT ENVIRONMENT
   EVENTS PAGE
   ========================================================= */

const EVENTS_API_URL = RI_CONFIG.API_BASE_URL;
// Stores events retrieved from the backend.
let allEvents = [];


document.addEventListener("DOMContentLoaded", () => {

    const searchInput =
        document.getElementById("event-search");

    const categoryFilter =
        document.getElementById("event-category-filter");

    // Search whenever the user types.
    if (searchInput) {
        searchInput.addEventListener(
            "input",
            applyEventFilters
        );
    }

    // Filter whenever the selected category changes.
    if (categoryFilter) {
        categoryFilter.addEventListener(
            "change",
            applyEventFilters
        );
    }

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

// Keep the original event records.
allEvents = events;

// Generate category options from backend data.
populateEventCategories(allEvents);

// Display events using the current search and filters.
applyEventFilters();

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
   POPULATE EVENT CATEGORIES
   ========================================================= */

function populateEventCategories(events) {

    const categoryFilter =
        document.getElementById("event-category-filter");

    if (!categoryFilter) {
        return;
    }

    const categories = [
        ...new Set(
            events
                .map(event => String(event.category || "").trim())
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b));

    // Rebuild the dropdown safely using DOM elements.
    const allOption = document.createElement("option");

    allOption.value = "all";
    allOption.textContent = "All Categories";

    categoryFilter.replaceChildren(allOption);

    categories.forEach(category => {

        const option = document.createElement("option");

        option.value = category.toLowerCase();
        option.textContent = category;

        categoryFilter.appendChild(option);
    });
}


/* =========================================================
   SEARCH AND FILTER EVENTS
   ========================================================= */

function applyEventFilters() {

    const eventsList =
        document.getElementById("events-list");

    const searchInput =
        document.getElementById("event-search");

    const categoryFilter =
        document.getElementById("event-category-filter");

    const resultCount =
        document.getElementById("events-result-count");

    if (!eventsList) {
        return;
    }

    const searchTerm =
        searchInput ? searchInput.value.trim().toLowerCase() : "";

    const selectedCategory =
        categoryFilter ? categoryFilter.value : "all";

    const filteredEvents = allEvents.filter(event => {

        const searchableText = [
            event.title,
            event.description,
            event.location,
            event.campus_name,
            event.campus_code,
            event.category
        ]
            .filter(value => value !== null && value !== undefined)
            .join(" ")
            .toLowerCase();

        const matchesSearch =
            searchableText.includes(searchTerm);

        const eventCategory =
            String(event.category || "").trim().toLowerCase();

        const matchesCategory =
            selectedCategory === "all" ||
            eventCategory === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    // Update the result counter.
    if (resultCount) {
        resultCount.textContent =
            `Showing ${filteredEvents.length} of ${allEvents.length} events`;
    }

    // Display a specific message when filters return no matches.
    if (filteredEvents.length === 0 && allEvents.length > 0) {

        eventsList.innerHTML = `
            <div class="event-empty-message">
                <h3>No matching events found</h3>
                <p>
                    Try another search term or select a different category.
                </p>
            </div>
        `;

        return;
    }

    // Render the matching events.
    renderEvents(filteredEvents);
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
