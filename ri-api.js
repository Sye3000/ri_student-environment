const RI_API = {
    async request(endpoint, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const isFormData =
        options.body instanceof FormData;

    const headers = {
        ...(isFormData
            ? {}
            : { "Content-Type": "application/json" }),
        ...(options.headers || {})
    };

   try {
    const apiEndpoint =
        endpoint.startsWith("/api/")
            ? endpoint
            : `/api${endpoint}`;

    const response = await fetch(
        `${RI_CONFIG.API_BASE_URL}${apiEndpoint}`,
        {
            ...options,
            headers,
            signal:
                options.signal ||
                controller.signal
        }
    );

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error(
                "The server returned invalid JSON."
            );
        }

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Request failed."
            );
        }

        return data;

    } catch (error) {

        if (error.name === "AbortError") {
            throw new Error(
                "The server took too long to respond."
            );
        }

        throw error;

    } finally {
        clearTimeout(timeout);
    }
},

    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: "GET" });
    },

    post(endpoint, body, options = {}) {
    const requestBody =
        body instanceof FormData
            ? body
            : JSON.stringify(body);

    return this.request(endpoint, {
        ...options,
        method: "POST",
        body: requestBody
    });
},

    put(endpoint, body, options = {}) {
    const requestBody =
        body instanceof FormData
            ? body
            : JSON.stringify(body);

    return this.request(endpoint, {
        ...options,
        method: "PUT",
        body: requestBody
    });
},

    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: "DELETE" });
    }
};
