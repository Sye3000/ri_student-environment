/* =========================================================
   RI STUDENT ENVIRONMENT
   SRC DASHBOARD
   ========================================================= */


/* =========================================================
   SRC DASHBOARD INITIALISATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    /*
     * Authentication is handled centrally by auth.js.
     *
     * This ensures that only an authenticated SRC member
     * can access this dashboard.
     */
    const student = await requireRole("src");

    if (!student) {
        return;
    }

    console.log("SRC DASHBOARD: AUTHENTICATED", {
        student_id: student.student_id,
        name: student.full_name,
        role: student.role,
        campus_id: student.campus_id
    });


    /* =====================================================
       ELEMENTS
       ===================================================== */

    const requestsList =
        document.getElementById("srcRequestsList");

    const newRequestsCount =
        document.getElementById("newRequestsCount");

    const inReviewRequestsCount =
        document.getElementById("inReviewRequestsCount");

    const resolvedRequestsCount =
        document.getElementById("resolvedRequestsCount");


    /* =====================================================
       FORMAT STATUS
       ===================================================== */

    function formatStatus(status) {

        if (!status) {
            return "Unknown";
        }

        return String(status)
            .replace(/_/g, " ")
            .replace(/\b\w/g, letter =>
                letter.toUpperCase()
            );
    }


    /* =====================================================
       FORMAT REQUEST TYPE
       ===================================================== */

    function formatRequestType(type) {

        if (!type) {
            return "Request";
        }

        return String(type)
            .replace(/_/g, " ")
            .replace(/\b\w/g, letter =>
                letter.toUpperCase()
            );
    }


    /* =====================================================
       ESCAPE HTML
       ===================================================== */

    function escapeHtml(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       UPDATE REQUEST STATISTICS
       ===================================================== */

    function updateStatistics(requests) {

        const newCount =
            requests.filter(
                request =>
                    request.status === "new"
            ).length;

        const inReviewCount =
            requests.filter(
                request =>
                    request.status === "in_review"
            ).length;

        const resolvedCount =
            requests.filter(
                request =>
                    request.status === "resolved"
            ).length;


        if (newRequestsCount) {
            newRequestsCount.textContent =
                newCount;
        }

        if (inReviewRequestsCount) {
            inReviewRequestsCount.textContent =
                inReviewCount;
        }

        if (resolvedRequestsCount) {
            resolvedRequestsCount.textContent =
                resolvedCount;
        }
    }


    /* =====================================================
       RENDER SRC REQUESTS
       ===================================================== */

    function renderRequests(requests) {

        if (!requestsList) {
            return;
        }


        if (
            !requests ||
            requests.length === 0
        ) {

            requestsList.innerHTML = `
                <p class="src-requests-empty">
                    There are currently no student requests
                    for your campus.
                </p>
            `;

            updateStatistics([]);

            return;
        }


        updateStatistics(requests);


        requestsList.innerHTML =
            requests.map(request => {

                const date =
                    request.created_at
                        ? new Date(
                            request.created_at
                        ).toLocaleString()
                        : "Date unavailable";


                return `
                    <article class="src-request-card">

                        <div class="src-request-card-header">

                            <div>

                                <h3>
                                    ${escapeHtml(
                                        request.title
                                    )}
                                </h3>

                                <p class="src-request-student">
                                    Student:
                                    ${escapeHtml(
                                        request.student_name ||
                                        "Unknown student"
                                    )}
                                </p>

                                <span class="src-request-type">
                                    ${formatRequestType(
                                        request.request_type
                                    )}
                                </span>

                            </div>

                            <span class="src-request-status">
                                ${formatStatus(
                                    request.status
                                )}
                            </span>

                        </div>


                        <p class="src-request-description">
                            ${escapeHtml(
                                request.description
                            )}
                        </p>


                        <div class="src-request-meta">

                            <span>
                                Campus:
                                ${escapeHtml(
                                    request.campus_name ||
                                    "Unknown campus"
                                )}
                            </span>

                            <span>
                                Submitted:
                                ${escapeHtml(date)}
                            </span>

                        </div>


                        <div class="src-request-actions">

                            <textarea
                                class="src-request-response"
                                data-request-response="${request.request_id}"
                                placeholder="Write a response to the student..."
                                rows="3"
                            >${escapeHtml(
                                request.src_response || ""
                            )}</textarea>


                            <select
                                class="src-request-status-select"
                                data-request-status="${request.request_id}"
                            >

                                <option
                                    value="in_review"
                                    ${
                                        request.status === "in_review"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    In Review
                                </option>

                                <option
                                    value="escalated"
                                    ${
                                        request.status === "escalated"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Escalated
                                </option>

                                <option
                                    value="resolved"
                                    ${
                                        request.status === "resolved"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Resolved
                                </option>

                            </select>


                            <button
                                type="button"
                                class="src-request-action"
                                data-request-id="${request.request_id}"
                            >
                                Update Request
                            </button>

                        </div>

                    </article>
                `;

            }).join("");
    }


    /* =====================================================
       LOAD SRC REQUESTS
       ===================================================== */

    async function loadSrcRequests() {

        if (!requestsList) {
            return;
        }


        const token = getToken();

        if (!token) {

            requestsList.innerHTML = `
                <p class="src-requests-error">
                    Please log in to access the SRC portal.
                </p>
            `;

            return;
        }


        try {

            console.log(
                "SRC DASHBOARD: LOADING REQUESTS"
            );


            const data =
                await RI_API.get(
                    "/api/student-requests/src",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            renderRequests(
                data.requests || []
            );


            console.log(
                "SRC DASHBOARD: REQUESTS LOADED"
            );

        } catch (error) {

            console.error(
                "SRC DASHBOARD: REQUEST LOADING ERROR",
                error
            );


            requestsList.innerHTML = `
                <p class="src-requests-error">
                    ${escapeHtml(
                        error.message ||
                        "Unable to load student requests."
                    )}
                </p>
            `;
        }
    }


    /* =====================================================
       UPDATE STUDENT REQUEST
       ===================================================== */

    document.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    ".src-request-action"
                );

            if (!button) {
                return;
            }


            const requestId =
                button.dataset.requestId;


            const responseBox =
                document.querySelector(
                    `[data-request-response="${requestId}"]`
                );


            const statusSelect =
                document.querySelector(
                    `[data-request-status="${requestId}"]`
                );


            const srcResponse =
                responseBox
                    ? responseBox.value.trim()
                    : "";


            const selectedStatus =
                statusSelect
                    ? statusSelect.value
                    : "in_review";


            const token = getToken();


            if (!token) {

                alert(
                    "Your session has expired. Please log in again."
                );

                window.location.href =
                    "login.html";

                return;
            }


            if (!srcResponse) {

                alert(
                    "Please enter a response to the student."
                );

                return;
            }


            button.disabled = true;
            button.textContent = "Updating...";


            try {

                const data =
                    await RI_API.put(
                        `/api/student-requests/${requestId}/status`,
                        {
                            status: selectedStatus,
                            src_response: srcResponse
                        },
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );


                console.log(
                    "SRC DASHBOARD: REQUEST UPDATED",
                    data
                );


                alert(
                    "Request updated successfully."
                );


                await loadSrcRequests();

            } catch (error) {

                console.error(
                    "SRC DASHBOARD: REQUEST UPDATE ERROR",
                    error
                );


                alert(
                    error.message ||
                    "Unable to update the request."
                );


                button.disabled = false;
                button.textContent =
                    "Update Request";
            }

        }
    );


    /* =====================================================
       SRC EVENT CREATION
       ===================================================== */

    const srcEventForm =
        document.getElementById(
            "srcEventForm"
        );

    const srcEventStatus =
        document.getElementById(
            "srcEventStatus"
        );

    /* =====================================================
       SRC TICKET BUILDER
       ===================================================== */

    const srcTicketList =
        document.getElementById("srcTicketList");

    const addSrcTicketButton =
        document.getElementById("addSrcTicket");

    let srcTicketCounter = 0;

    function addTicketRow(
        defaultName = "",
        defaultPrice = "",
        defaultQuantity = ""
    ) {
        if (!srcTicketList) {
            return;
        }

        srcTicketCounter += 1;

        const ticketRow =
            document.createElement("div");

        ticketRow.className =
            "src-ticket-row";

        ticketRow.dataset.ticketId =
            srcTicketCounter;

        ticketRow.innerHTML = `
            <div class="src-ticket-row-header">
                <strong>
                    Ticket ${srcTicketCounter}
                </strong>

                ${
                    srcTicketCounter > 1
                        ? `
                            <button
                                type="button"
                                class="src-ticket-remove"
                                data-remove-ticket="${srcTicketCounter}"
                            >
                                Remove
                            </button>
                          `
                        : ""
                }
            </div>

            <div class="form-row">

                <div class="form-group">

                    <label>
                        Ticket Name
                    </label>

                    <input
                        type="text"
                        class="src-ticket-name"
                        placeholder="e.g. General Admission"
                        value="${defaultName}"
                        maxlength="100"
                        required
                    >

                </div>

                <div class="form-group">

                    <label>
                        Price (R)
                    </label>

                    <input
                        type="number"
                        class="src-ticket-price"
                        placeholder="50.00"
                        min="0"
                        step="0.01"
                        value="${defaultPrice}"
                        required
                    >

                </div>

                <div class="form-group">

                    <label>
                        Quantity
                    </label>

                    <input
                        type="number"
                        class="src-ticket-quantity"
                        placeholder="100"
                        min="1"
                        step="1"
                        value="${defaultQuantity}"
                        required
                    >

                </div>

            </div>
        `;

        srcTicketList.appendChild(ticketRow);
    }

    if (srcTicketList) {
        addTicketRow(
            "General Admission",
            "0.00",
            "100"
        );
    }

    if (addSrcTicketButton) {
        addSrcTicketButton.addEventListener(
            "click",
            () => {
                addTicketRow();
            }
        );
    }

    if (srcTicketList) {
        srcTicketList.addEventListener(
            "click",
            event => {
                const removeButton =
                    event.target.closest(
                        "[data-remove-ticket]"
                    );

                if (!removeButton) {
                    return;
                }

                const ticketId =
                    removeButton.dataset.removeTicket;

                const row =
                    srcTicketList.querySelector(
                        `[data-ticket-id="${ticketId}"]`
                    );

                if (row) {
                    row.remove();
                }

                const remainingRows =
                    srcTicketList.querySelectorAll(
                        ".src-ticket-row"
                    );

                if (remainingRows.length === 0) {
                    addTicketRow();
                }
            }
        );
    }

    function collectSrcTickets() {
        if (!srcTicketList) {
            return [];
        }

        const rows =
            srcTicketList.querySelectorAll(
                ".src-ticket-row"
            );

        return Array.from(rows).map(row => ({
            name:
                row.querySelector(
                    ".src-ticket-name"
                )?.value.trim() || "",

            price:
                row.querySelector(
                    ".src-ticket-price"
                )?.value || "",

            quantity:
                row.querySelector(
                    ".src-ticket-quantity"
                )?.value || ""
        }));
    }




    if (srcEventForm) {

        srcEventForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const token = getToken();


                if (!token) {

                    alert(
                        "Your session has expired. Please log in again."
                    );

                    window.location.href =
                        "login.html";

                    return;
                }


                const submitButton =
                    srcEventForm.querySelector(
                        'button[type="submit"]'
                    );


                const title =
                    document.getElementById(
                        "eventTitle"
                    )?.value.trim();


                const description =
                    document.getElementById(
                        "eventDescription"
                    )?.value.trim();


                const eventDate =
                    document.getElementById(
                        "eventDate"
                    )?.value;


                const startTime =
                    document.getElementById(
                        "eventStartTime"
                    )?.value;


                const endTime =
                    document.getElementById(
                        "eventEndTime"
                    )?.value;


                const location =
                    document.getElementById(
                        "eventLocation"
                    )?.value.trim();
console.log("EVENT FORM VALUES:", {
    title,
    description,
    eventDate,
    startTime,
    endTime,
    location
});




                if (
                    !title ||
                    !description ||
                    !eventDate ||
                    !location
                ) {

                    alert(
                        "Please complete all required event fields."
                    );

                    return;
                }


                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.textContent =
                        "Submitting...";
                }


                if (srcEventStatus) {

                    srcEventStatus.textContent =
                        "Submitting event for administrator review...";
                }


                try {

                    console.log(
                        "SRC DASHBOARD: SUBMITTING EVENT"
                    );


                    const tickets =
                        collectSrcTickets();

                    if (
                        !tickets.length
                    ) {
                        alert(
                            "Please add at least one ticket type."
                        );

                        if (submitButton) {
                            submitButton.disabled =
                                false;

                            submitButton.textContent =
                                "Submit Event for Approval";
                        }

                        return;
                    }

                    for (const ticket of tickets) {

                        const price =
                            Number(ticket.price);

                        const quantity =
                            Number(ticket.quantity);

                        if (
                            !ticket.name ||
                            !Number.isFinite(price) ||
                            price < 0 ||
                            !Number.isInteger(quantity) ||
                            quantity <= 0
                        ) {
                            alert(
                                "Please complete every ticket with a valid name, price and quantity."
                            );

                            if (submitButton) {
                                submitButton.disabled =
                                    false;

                                submitButton.textContent =
                                    "Submit Event for Approval";
                            }

                            return;
                        }
                    }

                    const ticketNames =
                        tickets.map(ticket =>
                            ticket.name.toLowerCase()
                        );

                    if (
                        new Set(ticketNames).size !==
                        ticketNames.length
                    ) {
                        alert(
                            "Ticket names must be unique."
                        );

                        if (submitButton) {
                            submitButton.disabled =
                                false;

                            submitButton.textContent =
                                "Submit Event for Approval";
                        }

                        return;
                    }

                    const formData =
                        new FormData(srcEventForm);

                    formData.set(
                        "tickets",
                        JSON.stringify(tickets)
                    );

                    console.log(
                        "SRC DASHBOARD: TICKETS",
                        tickets
                    );

                    const data =
                        await RI_API.post(
                            "/api/events",
                            formData,
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                }
                            }
                        );


                    console.log(
                        "SRC DASHBOARD: EVENT SUBMITTED",
                        data
                    );


                    alert(
                        "Event submitted successfully. It is now waiting for administrator approval."
                    );


                    srcEventForm.reset();


                    if (srcEventStatus) {

                        srcEventStatus.textContent =
                            "Event submitted successfully and is awaiting administrator approval.";
                    }

                } catch (error) {

                    console.error(
                        "SRC DASHBOARD: EVENT SUBMISSION ERROR",
                        error
                    );


                    alert(
                        error.message ||
                        "Unable to submit event."
                    );


                    if (srcEventStatus) {

                        srcEventStatus.textContent =
                            error.message ||
                            "Unable to submit event.";
                    }

                } finally {

                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            "Submit Event for Approval";
                    }
                }

            }
        );
    }


    /* =====================================================
       LOAD INITIAL DATA
       ===================================================== */

    await loadSrcRequests();

});
