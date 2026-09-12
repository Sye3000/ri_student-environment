// ============================================================
// RI STUDENT ENVIRONMENT - LOST & FOUND
// Frontend JavaScript
// ============================================================

const API_BASE_URL = "http://192.168.122.10:3000/api";

// ============================================================
// AUTHENTICATION
// ============================================================

function getAuthToken() {
    return localStorage.getItem("ri_student_token");
}

function getAuthHeaders() {
    const token = getAuthToken();

    if (!token) {
        return null;
    }

    return {
        Authorization: `Bearer ${token}`
    };
}

function requireAuthentication() {
    const token = getAuthToken();

    if (!token) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}

// ============================================================
// API HELPER
// ============================================================

async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();

    if (!token) {
        window.location.href = "login.html";
        throw new Error("Authentication required.");
    }

    const headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
    };

    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, 15000);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
            signal: controller.signal
        });

        let data = {};

        try {
            data = await response.json();
        } catch {
            data = {};
        }

        if (response.status === 401) {
            localStorage.removeItem("ri_student_token");
            localStorage.removeItem("ri_student");
            window.location.href = "login.html";
            throw new Error("Your session has expired.");
        }

        if (!response.ok) {
            throw new Error(
                data.message || `Request failed with status ${response.status}`
            );
        }

        return data;

    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error("The request timed out. Please try again.");
        }

        throw error;

    } finally {
        clearTimeout(timeout);
    }
}

// ============================================================
// HTML ESCAPING
// ============================================================

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

// ============================================================
// STATUS MESSAGE
// ============================================================

function showStatus(message, type = "info") {
    const status = document.getElementById("lostFoundStatus");

    if (!status) {
        return;
    }

    status.textContent = message;
    status.className = `lf-status ${type}`;
    status.hidden = false;

    clearTimeout(showStatus.timeout);

    showStatus.timeout = setTimeout(() => {
        status.hidden = true;
    }, 5000);
}

// ============================================================
// MODE SWITCHING
// ============================================================

function setMode(mode) {
    const buttons = document.querySelectorAll(".lf-mode-card");

    const chatSection = document.getElementById("chatSection");
    const registerSection = document.getElementById("registerSection");
    const foundSection = document.getElementById("foundSection");
    const itemsSection = document.getElementById("itemsSection");

    const modeToSection = {
        chat: "chatSection",
        register: "registerSection",
        found: "foundSection",
        items: "itemsSection"
    };

    const activeSection = modeToSection[mode];

    // Update active button
    buttons.forEach(button => {
        const selected = button.dataset.section === activeSection;

        button.classList.toggle("active", selected);
        button.setAttribute("aria-selected", String(selected));
    });

    // Show/hide sections
    if (chatSection) {
        chatSection.hidden = mode !== "chat";
    }

    if (registerSection) {
        registerSection.hidden = mode !== "register";
    }

    if (foundSection) {
        foundSection.hidden = mode !== "found";
    }

    if (itemsSection) {
        itemsSection.hidden = mode !== "items";
    }

    // Load items when Browse Items is selected
    if (mode === "items") {
        loadLostFoundItems();
    }
}
// ============================================================
// IMAGE PREVIEW
// ============================================================

function setupImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    if (!input || !preview) {
        return;
    }

    input.addEventListener("change", () => {
        const file = input.files[0];

        preview.innerHTML = "";

        if (!file) {
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            input.value = "";
            showStatus(
                "Please upload a JPG, PNG or WEBP image.",
                "error"
            );
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            input.value = "";
            showStatus(
                "Image must be smaller than 5MB.",
                "error"
            );
            return;
        }

        const image = document.createElement("img");

        image.src = URL.createObjectURL(file);
        image.alt = "Selected item photo";
        image.className = "lf-photo-preview-image";

        preview.appendChild(image);
    });
}

// ============================================================
// FORM VALIDATION
// ============================================================

function validateForm(form, reportType) {
    const category = form.querySelector(
        '[name="itemCategory"]'
    );

    const description = form.querySelector(
        '[name="description"]'
    );

    const location = form.querySelector(
        '[name="location"]'
    );

    if (!category || !category.value) {
        showStatus(
            "Please select an item category.",
            "error"
        );

        return false;
    }

    if (!description || description.value.trim().length < 5) {
        showStatus(
            "Please provide a description of at least 5 characters.",
            "error"
        );

        return false;
    }

    if (!location || !location.value.trim()) {
        showStatus(
            "Please provide the location.",
            "error"
        );

        return false;
    }

    if (reportType === "found") {
        const foundDate = form.querySelector(
            '[name="foundDate"]'
        );

        if (foundDate && !foundDate.value) {
            showStatus(
                "Please provide the date the item was found.",
                "error"
            );

            return false;
        }
    }

    return true;
}

// ============================================================
// REGISTER LOST / FOUND ITEM
// ============================================================

async function submitLostFoundForm(form, reportType) {
    if (!requireAuthentication()) {
        return;
    }

    if (!validateForm(form, reportType)) {
        return;
    }

    const submitButton = form.querySelector(
        'button[type="submit"]'
    );

    const originalButtonText = submitButton
        ? submitButton.textContent
        : "";

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Registering...";
    }

    try {
        const formData = new FormData(form);

        // Explicitly tell backend whether this is lost or found.
        formData.set("reportType", reportType);

        // Make sure the backend receives the correct field names.
        formData.delete("itemType");

        // Send foundDate only for found reports.
        if (reportType === "lost") {
            formData.delete("foundDate");
        }

        const data = await apiRequest(
            "/lost-found/register-item",
            {
                method: "POST",
                body: formData
            }
        );

        showStatus(
            data.message ||
            `${reportType === "lost" ? "Lost" : "Found"} item registered successfully.`,
            "success"
        );

        form.reset();

        // Clear preview
        const preview = form.querySelector(".lf-photo-preview");

        if (preview) {
            preview.innerHTML = "";
        }

        // Reload items
        await loadLostFoundItems();

        // Switch to browse mode
        setMode("items");

    } catch (error) {
        console.error(
            "Lost & Found registration error:",
            error
        );

        showStatus(
            error.message ||
            "Unable to register the item.",
            "error"
        );

    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    }
}

// ============================================================
// LOAD LOST & FOUND ITEMS
// ============================================================

async function loadLostFoundItems() {
    const container = document.getElementById(
        "lostFoundItems"
    );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="lf-loading">
            Loading Lost & Found items...
        </div>
    `;

    try {
        const reportType =
            document.getElementById("itemTypeFilter")?.value || "";

        const category =
            document.getElementById("itemCategoryFilter")?.value || "";

        const search =
            document.getElementById("itemSearch")?.value.trim() || "";

        const params = new URLSearchParams();

        if (reportType) {
            params.set("reportType", reportType);
        }

        if (category) {
            params.set("itemCategory", category);
        }

        if (search) {
            params.set("search", search);
        }

        const query = params.toString();

        const data = await apiRequest(
            `/lost-found${query ? `?${query}` : ""}`
        );

        const items = Array.isArray(data.items)
            ? data.items
            : [];

        renderLostFoundItems(items);

    } catch (error) {
        console.error(
            "Unable to load Lost & Found items:",
            error
        );

        container.innerHTML = `
            <div class="lf-empty">
                <h3>Unable to load items</h3>
                <p>${escapeHtml(error.message)}</p>
                <button
                    type="button"
                    class="lf-action-btn"
                    onclick="loadLostFoundItems()"
                >
                    Try Again
                </button>
            </div>
        `;
    }
}

// ============================================================
// RENDER ITEMS
// ============================================================

function renderLostFoundItems(items) {
    const container = document.getElementById(
        "lostFoundItems"
    );

    if (!container) {
        return;
    }

    if (!items.length) {
        container.innerHTML = `
            <div class="lf-empty">
                <div class="lf-empty-icon">🔎</div>
                <h3>No matching items</h3>
                <p>
                    No open Lost & Found reports were found
                    for your campus.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML = items.map(item => {
        const isFound = item.report_type === "found";

        const statusClass =
            item.status === "matched"
                ? "matched"
                : isFound
                    ? "found"
                    : "lost";

        const image = item.image_path
            ? `${API_BASE_URL.replace("/api", "")}/${item.image_path}`
            : "";

        return `
            <article class="lf-item-card">

                <div class="lf-item-image">
                    ${
                        image
                            ? `
                                <img
                                    src="${escapeHtml(image)}"
                                    alt="${escapeHtml(
                                        item.item_category || "Lost & Found item"
                                    )}"
                                    onerror="this.parentElement.innerHTML='<span>📦</span>'"
                                >
                              `
                            : `
                                <span>
                                    ${isFound ? "📦" : "🔎"}
                                </span>
                              `
                    }
                </div>

                <div class="lf-item-content">

                    <div class="lf-item-top">

                        <span class="lf-item-type ${statusClass}">
                            ${isFound ? "FOUND" : "LOST"}
                        </span>

                        <span class="lf-item-status">
                            ${escapeHtml(item.status || "open")}
                        </span>

                    </div>

                    <h3>
                        ${escapeHtml(
                            formatCategory(item.item_category)
                        )}
                    </h3>

                    ${
                        item.brand || item.model
                            ? `
                                <p class="lf-item-model">
                                    ${escapeHtml(
                                        [item.brand, item.model]
                                            .filter(Boolean)
                                            .join(" ")
                                    )}
                                </p>
                              `
                            : ""
                    }

                    <p class="lf-item-description">
                        ${escapeHtml(
                            item.description || "No description provided."
                        )}
                    </p>

                    <div class="lf-item-details">

                        ${
                            item.color
                                ? `
                                    <span>
                                        <strong>Color:</strong>
                                        ${escapeHtml(item.color)}
                                    </span>
                                  `
                                : ""
                        }

                        ${
                            item.location
                                ? `
                                    <span>
                                        <strong>Location:</strong>
                                        ${escapeHtml(item.location)}
                                    </span>
                                  `
                                : ""
                        }

                        ${
                            item.found_date
                                ? `
                                    <span>
                                        <strong>Found:</strong>
                                        ${escapeHtml(
                                            formatDate(item.found_date)
                                        )}
                                    </span>
                                  `
                                : ""
                        }

                    </div>

                    ${
                        isFound &&
                        item.status === "open" &&
                        item.student_id !== getCurrentStudentId()
                            ? `
                                <button
                                    type="button"
                                    class="lf-claim-btn"
                                    onclick="claimItem(${Number(item.item_id)})"
                                >
                                    Claim Item
                                </button>
                              `
                            : ""
                    }

                </div>

            </article>
        `;
    }).join("");
}

// ============================================================
// FORMAT CATEGORY
// ============================================================

function formatCategory(category) {
    if (!category) {
        return "Unknown Item";
    }

    return String(category)
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, char => char.toUpperCase());
}

// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(dateValue) {
    if (!dateValue) {
        return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    return date.toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

// ============================================================
// CURRENT STUDENT
// ============================================================

function getCurrentStudentId() {
    try {
        const student = JSON.parse(
            localStorage.getItem("ri_student") || "{}"
        );

        return Number(student.student_id || 0);

    } catch {
        return 0;
    }
}

// ============================================================
// GET SINGLE ITEM
// ============================================================

async function viewItem(itemId) {
    try {
        const data = await apiRequest(
            `/lost-found/${Number(itemId)}`
        );

        const item = data.item;

        if (!item) {
            throw new Error("Item not found.");
        }

        const message = [
            `Type: ${item.report_type || item.item_type}`,
            `Category: ${formatCategory(item.item_category)}`,
            item.brand
                ? `Brand: ${item.brand}`
                : "",
            item.model
                ? `Model: ${item.model}`
                : "",
            item.color
                ? `Color: ${item.color}`
                : "",
            item.location
                ? `Location: ${item.location}`
                : "",
            item.description
                ? `Description: ${item.description}`
                : ""
        ]
            .filter(Boolean)
            .join("\n");

        alert(message);

    } catch (error) {
        showStatus(
            error.message || "Unable to load item.",
            "error"
        );
    }
}

// ============================================================
// CLAIM FOUND ITEM
// ============================================================

async function claimItem(itemId) {
    if (!confirm(
        "Are you sure this is your item and you want to claim it?"
    )) {
        return;
    }

    try {
        const data = await apiRequest(
            `/lost-found/claim/${Number(itemId)}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        showStatus(
            data.message || "Item claimed successfully.",
            "success"
        );

        await loadLostFoundItems();

    } catch (error) {
        console.error(
            "Claim item error:",
            error
        );

        showStatus(
            error.message ||
            "Unable to claim this item.",
            "error"
        );
    }
}

// ============================================================
// CHAT
// ============================================================

function addChatMessage(message, sender) {
    const chatMessages =
        document.getElementById("chatMessages");

    if (!chatMessages) {
        return;
    }

    const messageElement =
        document.createElement("div");

    messageElement.className =
        `lf-chat-message ${sender}`;

    messageElement.textContent = message;

    chatMessages.appendChild(messageElement);

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}

function generateLocalReply(message) {
    const text = message.toLowerCase();

    if (
        text.includes("lost") ||
        text.includes("missing")
    ) {
        return "If you lost an item, use the Report Lost section and provide as much detail as possible, including the location, description and item category.";
    }

    if (
        text.includes("found")
    ) {
        return "If you found an item on campus, use the Report Found section. Include where and when you found it so the owner can identify it.";
    }

    if (
        text.includes("claim")
    ) {
        return "Found items can be claimed from the Browse Items section. Only claim an item if you can verify that it belongs to you.";
    }

    if (
        text.includes("photo") ||
        text.includes("image")
    ) {
        return "You can upload a JPG, PNG or WEBP image up to 5MB with your report.";
    }

    if (
        text.includes("hello") ||
        text.includes("hi")
    ) {
        return "Hey! I'm the RI Lost & Found assistant. I can help you report, find or claim an item.";
    }

    return "I can help you with Lost & Found. You can report a lost item, report an item you found, browse reports or claim a found item.";
}

function handleChatSubmit(event) {
    event.preventDefault();

    const input =
        document.getElementById("userInput");

    if (!input) {
        return;
    }

    const message = input.value.trim();

    if (!message) {
        return;
    }

    addChatMessage(message, "user");

    input.value = "";

    setTimeout(() => {
        const reply =
            generateLocalReply(message);

        addChatMessage(reply, "bot");
    }, 500);
}

// ============================================================
// AI IDENTIFICATION
// ============================================================

async function identifyItemWithAI(file) {
    if (!file) {
        return;
    }

    try {
        const formData = new FormData();

        formData.append("image", file);

        showStatus(
            "AI is analysing the image...",
            "info"
        );

        const data = await apiRequest(
            "/lost-found/identify",
            {
                method: "POST",
                body: formData
            }
        );

        if (data.item) {
            populateAIResult(data.item);

            showStatus(
                "AI identification completed.",
                "success"
            );
        } else {
            showStatus(
                "AI could not identify the item. Please complete the form manually.",
                "info"
            );
        }

    } catch (error) {
        console.warn(
            "AI identification unavailable:",
            error.message
        );

        // AI is optional.
        showStatus(
            "AI identification is currently unavailable. You can still register the item manually.",
            "info"
        );
    }
}

// ============================================================
// AI RESULT -> LOST FORM
// ============================================================

function populateAIResult(item) {
    const mappings = {
        itemCategory: item.item_category || item.category,
        brand: item.brand,
        model: item.model,
        color: item.color,
        description: item.description
    };

    Object.entries(mappings).forEach(
        ([field, value]) => {

            if (!value) {
                return;
            }

            const element = document.querySelector(
                `#registerItemForm [name="${field}"]`
            );

            if (element) {
                element.value = value;
            }
        }
    );
}

// ============================================================
// FILTER EVENTS
// ============================================================

function setupFilters() {
    const typeFilter =
        document.getElementById("itemTypeFilter");

    const categoryFilter =
        document.getElementById("itemCategoryFilter");

    const search =
        document.getElementById("itemSearch");

    const refresh =
        document.getElementById("refreshLostFoundBtn");

    if (typeFilter) {
        typeFilter.addEventListener(
            "change",
            loadLostFoundItems
        );
    }

    if (categoryFilter) {
        categoryFilter.addEventListener(
            "change",
            loadLostFoundItems
        );
    }

    if (search) {
        let timer;

        search.addEventListener(
            "input",
            () => {
                clearTimeout(timer);

                timer = setTimeout(
                    loadLostFoundItems,
                    400
                );
            }
        );
    }

    if (refresh) {
        refresh.addEventListener(
            "click",
            loadLostFoundItems
        );
    }
}

// ============================================================
// QUICK CHAT BUTTONS
// ============================================================

function setupQuickChatButtons() {
    const buttons =
        document.querySelectorAll(
            "[data-chat-message]"
        );

    const input =
        document.getElementById("userInput");

    if (!input) {
        return;
    }

    buttons.forEach(button => {
        button.addEventListener(
            "click",
            () => {
                input.value =
                    button.dataset.chatMessage;

                input.focus();
            }
        );
    });
}

// ============================================================
// MODE BUTTONS
// ============================================================

function setupModeButtons() {
    const buttons = document.querySelectorAll(".lf-mode-card");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            const section = button.dataset.section;

            const sectionToMode = {
                chatSection: "chat",
                registerSection: "register",
                foundSection: "found",
                itemsSection: "items"
            };

            const mode = sectionToMode[section];

            if (mode) {
                setMode(mode);
            }
        });
    });
}
// ============================================================
// FORM EVENTS
// ============================================================

function setupForms() {
    const lostForm =
        document.getElementById("registerItemForm");

    const foundForm =
        document.getElementById("foundItemForm");

    if (lostForm) {
        lostForm.addEventListener(
            "submit",
            event => {
                event.preventDefault();

                submitLostFoundForm(
                    lostForm,
                    "lost"
                );
            }
        );
    }

    if (foundForm) {
        foundForm.addEventListener(
            "submit",
            event => {
                event.preventDefault();

                submitLostFoundForm(
                    foundForm,
                    "found"
                );
            }
        );
    }
}

// ============================================================
// AI PHOTO SETUP
// ============================================================

function setupAIPhoto() {
    const photoInput =
        document.getElementById("identifyPhoto");

    if (!photoInput) {
        return;
    }

    photoInput.addEventListener(
        "change",
        () => {
            const file =
                photoInput.files[0];

            if (!file) {
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                photoInput.value = "";

                showStatus(
                    "Image must be smaller than 5MB.",
                    "error"
                );

                return;
            }

            identifyItemWithAI(file);
        }
    );
}

// ============================================================
// CHAT FORM
// ============================================================

function setupChat() {
    const form =
        document.getElementById("chatForm");

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        handleChatSubmit
    );
}

// ============================================================
// LOGOUT
// ============================================================

function setupLogout() {
    const logoutLinks =
        document.querySelectorAll(
            ".logout-link, [data-logout]"
        );

    logoutLinks.forEach(link => {
        link.addEventListener(
            "click",
            () => {
                localStorage.removeItem(
                    "ri_student_token"
                );

                localStorage.removeItem(
                    "ri_student"
                );
            }
        );
    });
}

// ============================================================
// INITIALISE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        if (!requireAuthentication()) {
            return;
        }

        setupModeButtons();
        setupForms();
        setupFilters();
        setupQuickChatButtons();
        setupChat();
        setupAIPhoto();
        setupLogout();

        setupImagePreview(
            "lostItemPhoto",
            "lostPhotoPreview"
        );

        setupImagePreview(
            "itemPhoto",
            "foundPhotoPreview"
        );

        // Default mode
        setMode("register");

        // Load reports immediately so data is ready.
        await loadLostFoundItems();
    }
);
