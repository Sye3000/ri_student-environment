const EVENTS_API_URL = "http://192.168.122.10:3000";


document.addEventListener("DOMContentLoaded", () => {

    loadEventDetails();

});


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

        showEventError(
            "No event was selected."
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${EVENTS_API_URL}/api/events/${eventId}`,
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


        console.log(
            "Event Details API:",
            data
        );


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


        renderEvent(event);
renderTickets(data.tickets || []);


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
function renderEvent(event) {

    document.title =
        `${event.title} | RI Student Environment`;


    const title =
        document.getElementById(
            "event-title"
        );


    if (title) {

        title.textContent =
            event.title ||
            "Untitled Event";

    }


    const description =
        document.getElementById(
            "event-description"
        );


    if (description) {

        description.textContent =
            event.description ||
            "No description available.";

    }


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


    const time =
        document.getElementById(
            "event-time"
        );


    if (time) {

        time.textContent =
            formatEventTime(
                event.start_time,
                event.end_time
            ) ||
            "Time to be confirmed";

    }


    const location =
        document.getElementById(
            "event-location"
        );


    if (location) {

        location.textContent =
            event.location ||
            "Campus";

    }


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
            "You can return to the Events page to explore other opportunities.";

    }

}
function formatEventDate(value) {

    if (!value) {

        return "Date to be confirmed";

    }


    const parts =
        String(value).split("-");


    if (parts.length === 3) {

        const date =
            new Date(
                Number(parts[0]),
                Number(parts[1]) - 1,
                Number(parts[2])
            );


        return date.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );

    }


    return String(value);

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

}
function renderTickets(tickets) {

    const container =
        document.getElementById("event-tickets");


    if (!container) {
        return;
    }


    if (!tickets.length) {

        container.innerHTML = `
            <article class="participation-card">

                <span class="participation-number">
                    SOLD OUT
                </span>

                <h3>
                    No tickets available
                </h3>

                <p>
                    There are currently no tickets
                    available for this event.
                </p>

            </article>
        `;

        return;
    }


    container.innerHTML =
        tickets.map(ticket => {

            const price =
                Number(ticket.price)
                    .toFixed(2);

            const available =
                Math.max(
                    0,
                    Number(ticket.quantity_available) -
                    Number(ticket.quantity_sold)
                );


            return `
                <article class="participation-card">

                    <span class="participation-number">
                        TICKET
                    </span>

                    <h3>
                        ${escapeHtml(
                            ticket.ticket_name
                        )}
                    </h3>

                    <p>
                        R${price}
                    </p>

                    <p>
                        ${available} tickets available
                    </p>

                    <button
                        type="button"
                        class="cta-button"
                        onclick="selectTicket(${ticket.ticket_type_id})"
                    >
                        Select Ticket →
                    </button>

                </article>
            `;

        }).join("");
}


function selectTicket(ticketTypeId) {

    console.log(
        "Selected ticket:",
        ticketTypeId
    );

    alert(
        "Ticket selected. Purchase functionality coming next."
    );

}
function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
