const RI_API = {

    async request(endpoint, options = {}) {

        const token = localStorage.getItem("ri_student_token");

        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {})
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(
            `${RI_CONFIG.API_BASE_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );

        let data = null;

        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = text;
        }

        if (!response.ok) {
            const message =
                data && typeof data === "object" && data.message
                    ? data.message
                    : `Request failed with status ${response.status}`;

            throw new Error(message);
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
