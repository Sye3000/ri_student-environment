/* =========================================================
   RI STUDENT ENVIRONMENT
   RI eWallet
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIGURATION
       ===================================================== */

    const API_BASE =
        window.RI_API_BASE_URL ||
        (
            typeof RI_CONFIG !== "undefined" &&
            RI_CONFIG.API_BASE_URL
        ) ||
        window.location.origin;


    const TOKEN_KEY = "ri_student_token";
    const TICKET_WALLET_KEY = "ri_event_wallet";


    /* =====================================================
       DOM
       ===================================================== */

    const walletBalance =
        document.getElementById("walletBalance");

    const walletCurrency =
        document.getElementById("walletCurrency");

    const walletStatus =
        document.getElementById("walletStatus");

    const topUpButton =
        document.getElementById("topUpButton");

    const topUpPanel =
        document.getElementById("topUpPanel");

    const closeTopUpButton =
        document.getElementById("closeTopUpButton");

    const topUpForm =
        document.getElementById("topUpForm");

    const topUpAmount =
        document.getElementById("topUpAmount");

    const topUpMessage =
        document.getElementById("topUpMessage");

    const transactionsContainer =
        document.getElementById("transactionsContainer");

    const refreshTransactionsButton =
        document.getElementById(
            "refreshTransactionsButton"
        );

    const ticketsContainer =
        document.getElementById("ticketsContainer");

    const ticketCount =
        document.getElementById("ticketCount");

    const toast =
        document.getElementById("toast");


    /* =====================================================
       AUTH
       ===================================================== */

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }


    function requireLogin() {

        const token = getToken();

        if (!token) {
            window.location.href = "login.html";
            return false;
        }

        return true;
    }


    /* =====================================================
       API
       ===================================================== */

    async function apiRequest(
        endpoint,
        options = {}
    ) {

        const token = getToken();

        const headers = {
            ...(options.headers || {})
        };


        if (token) {
            headers.Authorization =
                `Bearer ${token}`;
        }


        const isFormData =
            options.body instanceof FormData;


        if (
            !isFormData &&
            options.body &&
            !headers["Content-Type"]
        ) {
            headers["Content-Type"] =
                "application/json";
        }


        const response =
            await fetch(
                `${API_BASE}${endpoint}`,
                {
                    ...options,
                    headers
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

            if (response.status === 401) {
                localStorage.removeItem(TOKEN_KEY);
                window.location.href = "login.html";
                return;
            }


            throw new Error(
                data.message ||
                "Request failed."
            );
        }


        return data;
    }


    /* =====================================================
       UTILITIES
       ===================================================== */

    function formatMoney(value) {

        const amount =
            Number(value);

        if (!Number.isFinite(amount)) {
            return "R0.00";
        }


        return `R${amount.toFixed(2)}`;
    }


    function formatDate(value) {

        if (!value) {
            return "Unknown date";
        }


        const date =
            new Date(value);


        if (Number.isNaN(date.getTime())) {
            return String(value);
        }


        return date.toLocaleString(
            "en-ZA",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );
    }


    function escapeHtml(value) {

        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    function showToast(message) {

        toast.textContent = message;

        toast.classList.add("show");


        clearTimeout(
            showToast.timeout
        );


        showToast.timeout =
            setTimeout(() => {
                toast.classList.remove("show");
            }, 3000);
    }


    /* =====================================================
       WALLET
       ===================================================== */

    async function loadWallet() {

        walletStatus.textContent =
            "Loading wallet...";


        try {

            const data =
                await apiRequest(
                    "/api/wallet"
                );


            const wallet =
                data.wallet ||
                data.data ||
                data;


            const balance =
                Number(wallet.balance ?? 0);


            walletBalance.textContent =
                formatMoney(balance);


            walletCurrency.textContent =
                wallet.currency ||
                "ZAR";


            walletStatus.textContent =
                wallet.status === "active"
                    ? "Wallet active"
                    : `Wallet ${wallet.status || "unavailable"}`;


        } catch (error) {

            console.error(
                "Wallet loading error:",
                error
            );


            walletBalance.textContent =
                "Unavailable";


            walletStatus.textContent =
                error.message ||
                "Unable to load wallet.";
        }
    }


    /* =====================================================
       TOP-UP
       ===================================================== */

    function openTopUp() {

        topUpPanel.classList.remove(
            "hidden"
        );


        topUpAmount.focus();
    }


    function closeTopUp() {

        topUpPanel.classList.add(
            "hidden"
        );


        topUpMessage.textContent = "";

        topUpMessage.className =
            "form-message";
    }


    async function handleTopUp(event) {

        event.preventDefault();


        const amount =
            Number(topUpAmount.value);


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            topUpMessage.textContent =
                "Enter a valid amount.";

            topUpMessage.className =
                "form-message error";

            return;
        }


        if (amount > 10000) {

            topUpMessage.textContent =
                "The development top-up limit is R10,000.";

            topUpMessage.className =
                "form-message error";

            return;
        }


        const submitButton =
            document.getElementById(
                "confirmTopUpButton"
            );


        submitButton.disabled = true;
        submitButton.textContent =
            "Adding funds...";


        topUpMessage.textContent = "";


        try {

            const data =
                await apiRequest(
                    "/api/wallet/top-up",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            amount
                        })
                    }
                );


            const topUp =
                data.top_up || {};


            topUpMessage.textContent =
                `Test funds added successfully. New balance: ${formatMoney(topUp.balance_after ?? 0)}.`;

            topUpMessage.className =
                "form-message success";


            topUpAmount.value = "";


            await loadWallet();
            await loadTransactions();


            showToast(
                "Test wallet top-up successful."
            );


        } catch (error) {

            console.error(
                "Top-up error:",
                error
            );


            topUpMessage.textContent =
                error.message ||
                "Top-up failed.";

            topUpMessage.className =
                "form-message error";


        } finally {

            submitButton.disabled = false;
            submitButton.textContent =
                "Add Test Funds";
        }
    }


    /* =====================================================
       TRANSACTIONS
       ===================================================== */

    async function loadTransactions() {

        transactionsContainer.innerHTML =
            `<div class="loading-state">
                Loading transactions...
             </div>`;


        try {

            const data =
                await apiRequest(
                    "/api/wallet/transactions"
                );


            const transactions =
                Array.isArray(data.transactions)
                    ? data.transactions
                    : [];


            if (transactions.length === 0) {

                transactionsContainer.innerHTML =
                    `<div class="empty-state">
                        <div class="empty-icon"><i class="fa-solid fa-credit-card" aria-hidden="true"></i></div>

                        <h3>No transactions yet</h3>

                        <p>
                            Your wallet activity will appear here.
                        </p>
                    </div>`;

                return;
            }


            transactionsContainer.innerHTML =
                transactions
                    .map(renderTransaction)
                    .join("");


        } catch (error) {

            console.error(
                "Transaction loading error:",
                error
            );


            transactionsContainer.innerHTML =
                `<div class="empty-state">
                    <h3>Unable to load transactions</h3>
                    <p>${escapeHtml(error.message)}</p>
                </div>`;
        }
    }


    function renderTransaction(transaction) {

        const type =
            String(
                transaction.transaction_type ||
                ""
            ).toLowerCase();


        const isCredit =
            type === "top_up" ||
            type === "refund";


        const amount =
            Number(transaction.amount || 0);


        const icon =
            isCredit
                ? "+"
                : "−";


        const amountPrefix =
            isCredit
                ? "+"
                : "−";


        let title =
            type
                .replaceAll("_", " ")
                .replace(/\b\w/g, char =>
                    char.toUpperCase()
                );


        if (type === "top_up") {
            title = "Wallet Top-Up";
        }


        if (type === "purchase") {
            title = "Purchase";
        }


        if (type === "refund") {
            title = "Refund";
        }


        return `
            <div class="transaction-row ${escapeHtml(type)}">

                <div class="transaction-icon">
                    ${icon}
                </div>

                <div>

                    <p class="transaction-title">
                        ${escapeHtml(title)}
                    </p>

                    <p class="transaction-description">
                        ${escapeHtml(
                            transaction.description ||
                            "Wallet transaction"
                        )}
                    </p>

                    <div class="transaction-date">
                        ${escapeHtml(
                            formatDate(
                                transaction.created_at
                            )
                        )}
                    </div>

                </div>

                <div
                    class="transaction-amount ${
                        isCredit
                            ? "credit"
                            : "debit"
                    }"
                >
                    ${amountPrefix}${formatMoney(amount)}
                </div>

            </div>
        `;
    }


    /* =====================================================
       EVENT TICKETS
       ===================================================== */

    function loadTickets() {

        let tickets = [];


        try {

            const raw =
                localStorage.getItem(
                    TICKET_WALLET_KEY
                );


            if (raw) {

                const parsed =
                    JSON.parse(raw);


                if (Array.isArray(parsed)) {
                    tickets = parsed;
                }
            }

        } catch (error) {

            console.error(
                "Ticket wallet error:",
                error
            );
        }


        ticketCount.textContent =
            `${tickets.length} ${
                tickets.length === 1
                    ? "ticket"
                    : "tickets"
            }`;


        if (tickets.length === 0) {

            ticketsContainer.innerHTML =
                `<div class="empty-state">

                    <div class="empty-icon"><i class="fa-solid fa-ticket" aria-hidden="true"></i></div>

                    <h3>No event tickets yet</h3>

                    <p>
                        Tickets you add to your RI
                        ticket wallet will appear here.
                    </p>

                    <a
                        href="events.html"
                        class="secondary-button"
                    >
                        Browse Events
                    </a>

                </div>`;

            return;
        }


        ticketsContainer.innerHTML =
            tickets
                .map(renderTicket)
                .join("");
    }


    function renderTicket(ticket) {

        const background =
            ticket.background ||
            "";


        const backgroundHtml =
            background
                ? `
                    <img
                        class="ticket-background"
                        src="${escapeHtml(
                            resolveImageUrl(background)
                        )}"
                        alt=""
                        onerror="this.style.display='none'"
                    >
                `
                : "";


        return `
            <article class="ticket-card">

                ${backgroundHtml}

                <div class="ticket-overlay"></div>

                <div class="ticket-content">

                    <div>

                        <div class="ticket-brand">
                            <span>RI STUDENT ENVIRONMENT</span>
                            <span>EVENT PASS</span>
                        </div>

                        <div class="ticket-type">
                            ${escapeHtml(
                                ticket.ticketName ||
                                "EVENT TICKET"
                            )}
                        </div>

                        <h3 class="ticket-title">
                            ${escapeHtml(
                                ticket.eventTitle ||
                                "RI Event"
                            )}
                        </h3>

                    </div>


                    <div>

                        <div class="ticket-meta">

                            <div>
                                <span>Date</span>

                                <strong>
                                    ${escapeHtml(
                                        formatTicketDate(
                                            ticket.date
                                        )
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Venue</span>

                                <strong>
                                    ${escapeHtml(
                                        ticket.venue ||
                                        "TBA"
                                    )}
                                </strong>
                            </div>

                        </div>


                        <div class="ticket-id">
                            TICKET ID:
                            ${escapeHtml(
                                ticket.id ||
                                "RI-TICKET"
                            )}
                        </div>

                    </div>

                </div>

            </article>
        `;
    }


    function formatTicketDate(value) {

        if (!value) {
            return "TBA";
        }


        const date =
            new Date(value);


        if (Number.isNaN(date.getTime())) {
            return String(value);
        }


        return date.toLocaleDateString(
            "en-ZA",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }


    function resolveImageUrl(imagePath) {

        if (!imagePath) {
            return "";
        }


        if (
            imagePath.startsWith("http://") ||
            imagePath.startsWith("https://") ||
            imagePath.startsWith("data:")
        ) {
            return imagePath;
        }


        if (imagePath.startsWith("/")) {
            return `${API_BASE}${imagePath}`;
        }


        return `${API_BASE}/${imagePath}`;
    }


    /* =====================================================
       EVENTS
       ===================================================== */

    topUpButton.addEventListener(
        "click",
        openTopUp
    );


    closeTopUpButton.addEventListener(
        "click",
        closeTopUp
    );


    topUpForm.addEventListener(
        "submit",
        handleTopUp
    );


    refreshTransactionsButton.addEventListener(
        "click",
        async () => {

            await loadWallet();
            await loadTransactions();

            showToast(
                "Wallet information refreshed."
            );
        }
    );


    document
        .querySelectorAll(
            ".quick-amounts button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    topUpAmount.value =
                        button.dataset.amount;

                    topUpAmount.focus();
                }
            );

        });


    /* =====================================================
       INITIALISE
       ===================================================== */

    async function initialise() {

        if (!requireLogin()) {
            return;
        }


        await Promise.all([
            loadWallet(),
            loadTransactions()
        ]);


        loadTickets();
    }


    initialise();

})();
