document.addEventListener("DOMContentLoaded", () => {

    const requestsList =
        document.getElementById("srcRequestsList");

    const newRequestsCount =
        document.getElementById("newRequestsCount");

    const inReviewRequestsCount =
        document.getElementById("inReviewRequestsCount");

    const resolvedRequestsCount =
        document.getElementById("resolvedRequestsCount");


    /*
     * Convert API status into readable text.
     */
    function formatStatus(status) {

        if (!status) {
            return "Unknown";
        }

        return status
            .replace(/_/g, " ")
            .replace(/\b\w/g, letter => letter.toUpperCase());
    }


    /*
     * Convert request type into readable text.
     */
    function formatRequestType(type) {

        if (!type) {
            return "Request";
        }

        return type
            .replace(/_/g, " ")
            .replace(/\b\w/g, letter => letter.toUpperCase());
    }


    /*
     * Prevent API text from being interpreted as HTML.
     */
    function escapeHtml(value) {

        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /*
     * Update the summary cards.
     */
    function updateStatistics(requests) {

        const newCount = requests.filter(
            request => request.status === "new"
        ).length;

        const inReviewCount = requests.filter(
            request => request.status === "in_review"
        ).length;

        const resolvedCount = requests.filter(
            request => request.status === "resolved"
        ).length;


        if (newRequestsCount) {
            newRequestsCount.textContent = newCount;
        }

        if (inReviewRequestsCount) {
            inReviewRequestsCount.textContent = inReviewCount;
        }

        if (resolvedRequestsCount) {
            resolvedRequestsCount.textContent = resolvedCount;
        }
    }


    /*
     * Display SRC requests.
     */
    function renderRequests(requests) {

        if (!requestsList) {
            return;
        }


        if (!requests || requests.length === 0) {

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


        requestsList.innerHTML = requests.map(request => {

            const date = request.created_at
                ? new Date(request.created_at).toLocaleString()
                : "Date unavailable";


            return `
                <article class="src-request-card">

                    <div class="src-request-card-header">

                        <div>

                            <h3>
                                ${escapeHtml(request.title)}
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
                            ${formatStatus(request.status)}
                        </span>

                    </div>


                    <p class="src-request-description">
                        ${escapeHtml(request.description)}
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
    >${escapeHtml(request.src_response || "")}</textarea>

    <select
        class="src-request-status-select"
        data-request-status="${request.request_id}"
    >
        <option
            value="in_review"
            ${request.status === "in_review" ? "selected" : ""}
        >
            In Review
        </option>

        <option
            value="escalated"
            ${request.status === "escalated" ? "selected" : ""}
        >
            Escalated
        </option>

        <option
            value="resolved"
            ${request.status === "resolved" ? "selected" : ""}
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

document.addEventListener("click", async (event) => {

    const button =
        event.target.closest(".src-request-action");

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

    const token =
        localStorage.getItem("ri_student_token");

    if (!token) {
        alert("Please log in again.");
        return;
    }

    if (!srcResponse) {
        alert("Please enter a response to the student.");
        return;
    }

    button.disabled = true;
    button.textContent = "Updating...";

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/student-requests/${requestId}/status`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify({
                    status: selectedStatus,
                    src_response: srcResponse
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Unable to update the request."
            );
        }

        alert("Request updated successfully.");

        await loadSrcRequests();

    } catch (error) {

        console.error(
            "SRC request update error:",
            error
        );

        alert(
            error.message ||
            "Unable to update the request."
        );

        button.disabled = false;
        button.textContent = "Update Request";
    }

});
    /*
     * Load requests assigned to the SRC.
     */
    async function loadSrcRequests() {

        if (!requestsList) {
            return;
        }


        const token =
            localStorage.getItem("ri_student_token");


        if (!token) {

            requestsList.innerHTML = `
                <p class="src-requests-error">
                    Please log in to access the SRC portal.
                </p>
            `;

            return;
        }


        try {

            const response = await fetch(
                `${API_BASE_URL}/api/student-requests/src`,
                {
                    method: "GET",

                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load student requests."
                );
            }


            renderRequests(data.requests || []);


        } catch (error) {

            console.error(
                "SRC request loading error:",
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


    /*
     * Load the SRC portal.
     */
    loadSrcRequests();

});
