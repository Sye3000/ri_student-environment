const RI_API = {

    async request(endpoint, options = {}) {

        const token = localStorage.getItem("ri_student_token");

        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, 10000);

        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {})
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        let response;

        try {

            response = await fetch(
                `${RI_CONFIG.API_BASE_URL}${endpoint}`,
                {
                    ...options,
                    headers,
                    signal: options.signal || controller.signal
                }
            );

        } catch (error) {

            if (error.name === "AbortError") {
                throw new Error(
                    "The server took too long to respond."
                );
            }

            throw new Error(
                "Unable to connect to the server."
            );

        } finally {

            clearTimeout(timeout);
        }

        let data;

        try {

            const contentType =
                response.headers.get("content-type") || "";

            if (contentType.includes("application/json")) {
                data = await response.json();
            } else {
                data = {
                    status: "error",
                    message: "Invalid server response"
                };
            }

        } catch {

            data = {
                status: "error",
                message: "Invalid server response"
            };
        }

        if (!response.ok) {

            throw new Error(
                data.message || "Request failed"
            );
        }

        return data;
    },

    get(endpoint, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: "GET"
        });
    },

    post(endpoint, body, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: "POST",
            body: JSON.stringify(body)
        });
    },

    put(endpoint, body, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: "PUT",
            body: JSON.stringify(body)
        });
    },

    delete(endpoint, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: "DELETE"
        });
    }
};
