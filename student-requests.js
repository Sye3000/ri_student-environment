document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("studentRequestForm");
    const message = document.getElementById("studentRequestMessage");
    const requestsList = document.getElementById("studentRequestsList");

    /*
     * Convert API status values into readable text.
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
     * Display the student's requests.
     */
    function renderRequests(requests) {

        if (!requestsList) {
            return;
        }

        if (!requests || requests.length === 0) {

            requestsList.innerHTML = `
                <p class="student-requests-empty">
                    You have not submitted any requests yet.
                </p>
            `;

            return;
        }


        requestsList.innerHTML = requests.map(request => {

            const srcResponse = request.src_response
                ? `
                    <div class="student-request-response">
                        <strong>SRC Response</strong>
                        <p>${escapeHtml(request.src_response)}</p>
                    </div>
                `
                : "";


            const adminResponse = request.admin_response
                ? `
                    <div class="student-request-response">
                        <strong>Administration Response</strong>
                        <p>${escapeHtml(request.admin_response)}</p>
                    </div>
                `
                : "";


            const date = request.created_at
                ? new Date(request.created_at).toLocaleString()
                : "Date unavailable";


            return `
                <article class="student-request-card">

                    <div class="student-request-card-header">

                        <div>

                            <h3>
                                ${escapeHtml(request.title)}
                            </h3>

                            <p class="student-request-type">
                                ${formatRequestType(request.request_type)}
                            </p>

                        </div>

                        <span class="student-request-status">
                            ${formatStatus(request.status)}
                        </span>

                    </div>


                    <p class="student-request-description">
                        ${escapeHtml(request.description)}
                    </p>


                    <div class="student-request-responses">
                        ${srcResponse}
                        ${adminResponse}
                    </div>


                    <div class="student-request-date">
                        Submitted: ${date}
                    </div>

                </article>
            `;

        }).join("");
    }


    /*
     * Basic HTML escaping.
     *
     * This prevents request text returned by the API
     * from being interpreted as HTML.
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
     * Load the current student's requests.
     */
    async function loadMyRequests() {

        if (!requestsList) {
            return;
        }

        const token = localStorage.getItem("ri_student_token");

        if (!token) {

            requestsList.innerHTML = `
                <p class="student-requests-error">
                    Please log in to view your requests.
                </p>
            `;

            return;
        }


        try {

            const response = await fetch(
                `${API_BASE_URL}/api/student-requests/mine`,
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
                    "Unable to load your requests."
                );

            }


            renderRequests(data.requests || []);


        } catch (error) {

            console.error(
                "Student requests loading error:",
                error
            );

            requestsList.innerHTML = `
                <p class="student-requests-error">
                    ${escapeHtml(
                        error.message ||
                        "Unable to load your requests."
                    )}
                </p>
            `;
        }
    }


    /*
     * Submit a new request.
     */
    if (form) {

        form.addEventListener("submit", async (event) => {

            event.preventDefault();


            const token = localStorage.getItem("ri_student_token");


            if (!token) {

                message.textContent =
                    "Please log in before submitting a request.";

                return;
            }


            const requestType =
                document.getElementById("requestType").value;

            const title =
                document.getElementById("requestTitle").value.trim();

            const description =
                document
                    .getElementById("requestDescription")
                    .value
                    .trim();


            if (!requestType || !title || !description) {

                message.textContent =
                    "Please complete all required fields.";

                return;
            }


            const submitButton =
                form.querySelector(".student-request-submit");


            submitButton.disabled = true;
            submitButton.textContent = "Submitting...";
            message.textContent = "";


            try {

                const response = await fetch(
                    `${API_BASE_URL}/api/student-requests`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },

                        body: JSON.stringify({
                            request_type: requestType,
                            title: title,
                            description: description
                        })
                    }
                );


                const data = await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to submit request."
                    );

                }


                message.textContent =
                    "Your request has been submitted successfully.";

                form.reset();


                /*
                 * Refresh the history immediately after
                 * a successful submission.
                 */
                await loadMyRequests();


            } catch (error) {

                console.error(
                    "Student request submission error:",
                    error
                );

                message.textContent =
                    error.message ||
                    "Something went wrong while submitting your request.";

            } finally {

                submitButton.disabled = false;
                submitButton.textContent = "Submit Request";

            }

        });

    }


    /*
     * Load existing requests when the page opens.
     */
    loadMyRequests();

});
