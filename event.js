/* =========================================================
   RI STUDENT ENVIRONMENT
   EVENT DETAILS + TICKETS
   ========================================================= */

const EVENTS_API_URL = RI_CONFIG.API_BASE_URL;

const RI_EVENT_WALLET_KEY = "ri_event_wallet";


/* =========================================================
   PAGE START
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    loadEventDetails();
});


/* =========================================================
   LOAD EVENT
   ========================================================= */

async function loadEventDetails() {

    const token =
        localStorage.getItem("ri_student_token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const params =
        new URLSearchParams(window.location.search);

    const eventId =
        params.get("id");

    if (!eventId) {
        showEventError("No event was selected.");
        return;
    }

    try {

        const response =
            await fetch(
                `${EVENTS_API_URL}/api/events/${encodeURIComponent(eventId)}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        console.log("Event Details API:", data);

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Unable to load event."
            );
        }

        const event =
            data.event;

        if (!event) {
            throw new Error(
                "Event information was not returned."
            );
        }

        window.currentEvent = event;

        renderEvent(event);
        renderTickets(
            Array.isArray(data.tickets)
                ? data.tickets
                : []
        );

    } catch (error) {

        console.error(
            "Event details error:",
            error
        );

        showEventError(
            error.message ||
            "Unable to load event."
        );
    }
}


/* =========================================================
   ASSET URL
   ========================================================= */

function resolveAssetUrl(value) {

    const raw =
        String(value || "").trim();

    if (!raw) {
        return "";
    }

    if (/^https?:\/\//i.test(raw)) {
        return raw;
    }

    const base =
        EVENTS_API_URL.replace(/\/$/, "");

    return `${base}${raw.startsWith("/") ? raw : "/" + raw}`;
}


/* =========================================================
   EVENT DETAILS
   ========================================================= */

function renderEvent(event) {

    document.title =
        `${event.title || "Event"} | RI Student Environment`;


    const title =
        document.getElementById("event-title");

    if (title) {
        title.textContent =
            event.title ||
            "Untitled Event";
    }


    const description =
        document.getElementById("event-description");

    if (description) {
        description.textContent =
            event.description ||
            "No description available.";
    }


    /* -----------------------------------------------------
       EVENT POSTER
       ----------------------------------------------------- */

    const poster =
        document.getElementById("event-poster");

    const posterContainer =
        document.getElementById(
            "event-poster-container"
        );

    if (poster && posterContainer) {

        const posterUrl =
            resolveAssetUrl(
                event.event_image
            );

        if (posterUrl) {

            poster.src =
                posterUrl;

            poster.alt =
                `${event.title || "Event"} poster`;

            posterContainer.hidden =
                false;

        } else {

            poster.removeAttribute("src");

            posterContainer.hidden =
                true;
        }
    }


    /* -----------------------------------------------------
       GOOGLE MAPS DIRECTIONS
       ----------------------------------------------------- */

    const directions =
        document.getElementById(
            "event-directions"
        );

    if (directions) {

        const query = [
            event.campus_name,
            event.location
        ]
            .filter(Boolean)
            .join(", ");

        if (query) {

            directions.href =
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

            directions.hidden =
                false;

        } else {

            directions.removeAttribute("href");

            directions.hidden =
                true;
        }
    }


    /* -----------------------------------------------------
       DATE
       ----------------------------------------------------- */

    const date =
        document.getElementById(
            "event-date"
        );

    if (date) {

        date.textContent =
            formatEventDate(
                event.event_date
            );
    }


    /* -----------------------------------------------------
       TIME
       ----------------------------------------------------- */

    const time =
        document.getElementById(
            "event-time"
        );

    if (time) {

        time.textContent =
            formatEventTimeRange(
                event.start_time,
                event.end_time
            ) ||
            "Time to be confirmed";
    }


    /* -----------------------------------------------------
       LOCATION
       ----------------------------------------------------- */

    const location =
        document.getElementById(
            "event-location"
        );

    if (location) {

        location.textContent =
            event.location ||
            "Campus";
    }


    /* -----------------------------------------------------
       CAMPUS
       ----------------------------------------------------- */

    const campus =
        document.getElementById(
            "event-campus"
        );

    if (campus) {

        campus.textContent =
            event.campus_name ||
            event.campus_code ||
            "Campus";
    }


    const message =
        document.getElementById(
            "event-action-message"
        );

    if (message) {

        message.textContent =
            "Choose an available ticket above to continue.";
    }
}


/* =========================================================
   RENDER TICKETS
   ========================================================= */

function renderTickets(tickets) {

    const container =
        document.getElementById(
            "event-tickets"
        );

    if (!container) {
        return;
    }


    if (!Array.isArray(tickets) || tickets.length === 0) {

        container.innerHTML = `
            <article class="participation-card">

                <span class="participation-number">
                    UNAVAILABLE
                </span>

                <h3>
                    No tickets available
                </h3>

                <p>
                    Ticket sales have not been configured
                    for this event yet.
                </p>

            </article>
        `;

        return;
    }


    const event =
        window.currentEvent || {};


    const background =
        resolveAssetUrl(
            event.ticket_background_image ||
            event.event_image ||
            ""
        );


    const eventTitle =
        escapeHtml(
            event.title ||
            "RI Student Event"
        );


    const eventDate =
        event.event_date
            ? formatEventDate(
                event.event_date
            )
            : "Date TBA";


    const eventTime =
        formatEventTimeRange(
            event.start_time,
            event.end_time
        ) ||
        "Time TBA";


    const eventLocation =
        escapeHtml(
            event.location ||
            "Venue TBA"
        );


    container.innerHTML =
        tickets.map(ticket => {

            const price =
                Number(ticket.price);

            const formattedPrice =
                Number.isFinite(price)
                    ? price.toFixed(2)
                    : "0.00";


            const available =
                Math.max(
                    0,
                    Number(
                        ticket.quantity_available
                    ) -
                    Number(
                        ticket.quantity_sold
                    )
                );


            const ticketName =
                escapeHtml(
                    ticket.ticket_name ||
                    "General Admission"
                );


            const backgroundStyle =
                background
                    ? `style="--ticket-background: url('${escapeAttribute(background)}');"`
                    : "";


            const soldOut =
                available <= 0;


            const availabilityText =
                soldOut
                    ? "Sold out"
                    : `${available} available`;


            return `
                <article
                    class="ri-event-ticket"
                    ${backgroundStyle}
                >

                    <div
                        class="ri-event-ticket-overlay"
                        aria-hidden="true"
                    ></div>


                    <div class="ri-event-ticket-content">

                        <div class="ri-event-ticket-top">

                            <div>

                                <span class="ri-event-ticket-brand">
                                    RI STUDENT ENVIRONMENT
                                </span>

                                <span class="ri-event-ticket-type">
                                    ${ticketName}
                                </span>

                            </div>

                            <div
                                class="ri-event-ticket-mark"
                                aria-hidden="true"
                            >
                                RI
                            </div>

                        </div>


                        <div class="ri-event-ticket-main">

                            <span class="ri-event-ticket-label">
                                ADMISSION
                            </span>

                            <h3>
                                ${ticketName}
                            </h3>

                            <p class="ri-event-ticket-event">
                                ${eventTitle}
                            </p>

                        </div>


                        <div class="ri-event-ticket-details">

                            <div>

                                <span class="ri-event-ticket-label">
                                    DATE
                                </span>

                                <strong>
                                    ${escapeHtml(eventDate)}
                                </strong>

                            </div>


                            <div>

                                <span class="ri-event-ticket-label">
                                    TIME
                                </span>

                                <strong>
                                    ${escapeHtml(eventTime)}
                                </strong>

                            </div>


                            <div>

                                <span class="ri-event-ticket-label">
                                    VENUE
                                </span>

                                <strong>
                                    ${eventLocation}
                                </strong>

                            </div>

                        </div>


                        <div class="ri-event-ticket-bottom">

                            <div class="ri-event-ticket-price">

                                <span class="ri-event-ticket-label">
                                    PRICE
                                </span>

                                <strong>
                                    R${formattedPrice}
                                </strong>

                            </div>


                            <div class="ri-event-ticket-availability">

                                <span>
                                    ${availabilityText}
                                </span>

                            </div>


                            <button
                                type="button"
                                class="ri-ticket-select-button"
                                ${soldOut ? "disabled" : ""}
                                onclick="selectTicket(${Number(ticket.ticket_type_id)})"
                            >
                                ${soldOut ? "Sold Out" : "Get Ticket"}
                                ${soldOut ? "" : "<span>→</span>"}
                            </button>

                        </div>

                    </div>

                </article>
            `;

        }).join("");
}


/* =========================================================
   SELECT TICKET
   ========================================================= */

function selectTicket(ticketTypeId) {

    const event =
        window.currentEvent;

    if (!event) {
        showToast(
            "Event information is unavailable."
        );
        return;
    }


    /*
       The ticket list is reconstructed from the DOM/API
       data. Find the selected ticket by loading the event
       again so we never trust a price supplied by the UI.
    */

    openTicketConfirmation(
        Number(ticketTypeId)
    );
}


/* =========================================================
   TICKET CONFIRMATION
   ========================================================= */

async function openTicketConfirmation(ticketTypeId) {

    const token =
        localStorage.getItem(
            "ri_student_token"
        );

    const event =
        window.currentEvent;

    if (!token || !event) {
        return;
    }


    try {

        const response =
            await fetch(
                `${EVENTS_API_URL}/api/events/${encodeURIComponent(event.event_id)}`,
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {
            throw new Error(
                data.message ||
                "Unable to verify ticket."
            );
        }


        const ticket =
            (data.tickets || [])
                .find(
                    item =>
                        Number(
                            item.ticket_type_id
                        ) ===
                        Number(ticketTypeId)
                );


        if (!ticket) {

            showToast(
                "This ticket is no longer available."
            );

            return;
        }


        const available =
            Math.max(
                0,
                Number(
                    ticket.quantity_available
                ) -
                Number(
                    ticket.quantity_sold
                )
            );


        if (available <= 0) {

            showToast(
                "This ticket type is sold out."
            );

            return;
        }


        showTicketPreview(
            event,
            ticket
        );

    } catch (error) {

        console.error(
            "Ticket verification error:",
            error
        );

        showToast(
            error.message ||
            "Unable to select this ticket."
        );
    }
}


/* =========================================================
   TICKET PREVIEW
   ========================================================= */

function showTicketPreview(event, ticket) {

    closeTicketModal();


    const background =
        resolveAssetUrl(
            event.ticket_background_image ||
            event.event_image ||
            ""
        );


    const ticketName =
        escapeHtml(
            ticket.ticket_name ||
            "General Admission"
        );


    const price =
        Number(ticket.price);


    const formattedPrice =
        Number.isFinite(price)
            ? `R${price.toFixed(2)}`
            : "Price TBA";


    const date =
        formatEventDate(
            event.event_date
        );


    const time =
        formatEventTimeRange(
            event.start_time,
            event.end_time
        );


    const venue =
        escapeHtml(
            event.location ||
            "Venue TBA"
        );


    const title =
        escapeHtml(
            event.title ||
            "RI Student Event"
        );


    const backgroundStyle =
        background
            ? `style="--ticket-background: url('${escapeAttribute(background)}');"`
            : "";


    const modal =
        document.createElement("div");

    modal.id =
        "ri-ticket-modal";

    modal.className =
        "ri-ticket-modal";


    modal.innerHTML = `

        <div
            class="ri-ticket-modal-backdrop"
            data-close-ticket-modal
        ></div>


        <div
            class="ri-ticket-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ri-ticket-modal-title"
        >

            <button
                type="button"
                class="ri-ticket-modal-close"
                aria-label="Close ticket"
                data-close-ticket-modal
            >
                ×
            </button>


            <div class="ri-ticket-modal-heading">

                <span class="eyebrow">
                    TICKET PREVIEW
                </span>

                <h2 id="ri-ticket-modal-title">
                    ${ticketName}
                </h2>

                <p>
                    Review your ticket before adding it
                    to your eWallet.
                </p>

            </div>


            <article
                class="ri-event-ticket ri-event-ticket-preview"
                ${backgroundStyle}
            >

                <div
                    class="ri-event-ticket-overlay"
                    aria-hidden="true"
                ></div>


                <div class="ri-event-ticket-content">

                    <div class="ri-event-ticket-top">

                        <div>

                            <span class="ri-event-ticket-brand">
                                RI STUDENT ENVIRONMENT
                            </span>

                            <span class="ri-event-ticket-type">
                                ${ticketName}
                            </span>

                        </div>

                        <div class="ri-event-ticket-mark">
                            RI
                        </div>

                    </div>


                    <div class="ri-event-ticket-main">

                        <span class="ri-event-ticket-label">
                            ADMISSION
                        </span>

                        <h3>
                            ${title}
                        </h3>

                        <p class="ri-event-ticket-event">
                            ${ticketName} • ${formattedPrice}
                        </p>

                    </div>


                    <div class="ri-event-ticket-details">

                        <div>
                            <span class="ri-event-ticket-label">
                                DATE
                            </span>

                            <strong>
                                ${escapeHtml(date)}
                            </strong>
                        </div>

                        <div>
                            <span class="ri-event-ticket-label">
                                TIME
                            </span>

                            <strong>
                                ${escapeHtml(time || "TBA")}
                            </strong>
                        </div>

                        <div>
                            <span class="ri-event-ticket-label">
                                VENUE
                            </span>

                            <strong>
                                ${venue}
                            </strong>
                        </div>

                    </div>


                    <div class="ri-event-ticket-preview-note">
                        Ticket will be stored on this device
                        in your RI eWallet.
                    </div>

                </div>

            </article>


            <div class="ri-ticket-modal-actions">

                <button
                    type="button"
                    class="secondary-btn"
                    data-close-ticket-modal
                >
                    Cancel
                </button>

                <button
                    type="button"
                    class="primary-btn"
                    id="ri-add-wallet-ticket"
                >
                    Add to eWallet
                </button>

            </div>

        </div>
    `;


    document.body.appendChild(
        modal
    );


    modal
        .querySelectorAll(
            "[data-close-ticket-modal]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                closeTicketModal
            );

        });


    document
        .getElementById(
            "ri-add-wallet-ticket"
        )
        .addEventListener(
            "click",
            () => {

                addTicketToWallet(
                    event,
                    ticket
                );

            }
        );
}


/* =========================================================
   ADD TICKET TO EWALLET
   ========================================================= */

function addTicketToWallet(event, ticket) {

    const wallet =
        getWallet();


    const ticketId =
        createTicketId();


    const background =
        resolveAssetUrl(
            event.ticket_background_image ||
            event.event_image ||
            ""
        );


    const walletTicket = {

        id:
            ticketId,

        eventId:
            Number(event.event_id),

        ticketTypeId:
            Number(ticket.ticket_type_id),

        eventTitle:
            event.title ||
            "RI Student Event",

        ticketName:
            ticket.ticket_name ||
            "General Admission",

        price:
            Number(ticket.price) || 0,

        date:
            event.event_date ||
            "",

        startTime:
            event.start_time ||
            "",

        endTime:
            event.end_time ||
            "",

        venue:
            event.location ||
            "",

        campus:
            event.campus_name ||
            event.campus_code ||
            "",

        background:
            background,

        purchasedAt:
            new Date().toISOString()

    };


    wallet.push(
        walletTicket
    );


    localStorage.setItem(
        RI_EVENT_WALLET_KEY,
        JSON.stringify(wallet)
    );


    closeTicketModal();


    showToast(
        "Ticket added to your eWallet."
    );


    console.log(
        "RI eWallet ticket:",
        walletTicket
    );
}


/* =========================================================
   EWALLET STORAGE
   ========================================================= */

function getWallet() {

    try {

        const stored =
            localStorage.getItem(
                RI_EVENT_WALLET_KEY
            );

        const wallet =
            stored
                ? JSON.parse(stored)
                : [];

        return Array.isArray(wallet)
            ? wallet
            : [];

    } catch (error) {

        console.error(
            "Unable to read RI eWallet:",
            error
        );

        return [];
    }
}


/* =========================================================
   TICKET ID
   ========================================================= */

function createTicketId() {

    const random =
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

    const timestamp =
        Date.now()
            .toString()
            .slice(-8);

    return `RI-${random}-${timestamp}`;
}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeTicketModal() {

    const modal =
        document.getElementById(
            "ri-ticket-modal"
        );

    if (modal) {
        modal.remove();
    }
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {

    let toast =
        document.getElementById(
            "ri-event-toast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );

        toast.id =
            "ri-event-toast";

        toast.className =
            "ri-event-toast";

        document.body.appendChild(
            toast
        );
    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        window.riToastTimer
    );


    window.riToastTimer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 3200);
}


/* =========================================================
   DATE
   ========================================================= */

function formatEventDate(value) {

    if (!value) {
        return "Date TBA";
    }


    const raw =
        String(value);


    const parts =
        raw.split("-");


    if (parts.length === 3) {

        const date =
            new Date(
                Number(parts[0]),
                Number(parts[1]) - 1,
                Number(parts[2])
            );


        if (!Number.isNaN(date.getTime())) {

            return date.toLocaleDateString(
                "en-ZA",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );
        }
    }


    return raw;
}


/* =========================================================
   TIME
   ========================================================= */

function formatEventTime(value) {

    if (!value) {
        return "";
    }


    const parts =
        String(value).split(":");


    if (parts.length < 2) {
        return String(value);
    }


    let hour =
        Number(parts[0]);


    const minute =
        parts[1];


    if (
        !Number.isFinite(hour) ||
        !minute
    ) {
        return String(value);
    }


    const suffix =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 || 12;


    return `${hour}:${minute} ${suffix}`;
}


function formatEventTimeRange(start, end) {

    if (!start) {
        return "";
    }


    const cleanStart =
        formatEventTime(start);


    if (!end) {
        return cleanStart;
    }


    return `${cleanStart} - ${formatEventTime(end)}`;
}


/* =========================================================
   ERROR
   ========================================================= */

function showEventError(message) {

    const title =
        document.getElementById(
            "event-title"
        );

    if (title) {

        title.textContent =
            "Unable to load event";
    }


    const description =
        document.getElementById(
            "event-description"
        );

    if (description) {

        description.textContent =
            message;
    }


    const tickets =
        document.getElementById(
            "event-tickets"
        );

    if (tickets) {

        tickets.innerHTML = `
            <article class="participation-card">

                <span class="participation-number">
                    ERROR
                </span>

                <h3>
                    Event unavailable
                </h3>

                <p>
                    ${escapeHtml(message)}
                </p>

            </article>
        `;
    }
}


/* =========================================================
   HTML ESCAPING
   ========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
