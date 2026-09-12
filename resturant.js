"use strict";

/*
 * RI Student Environment
 * Campus Dining Frontend
 *
 * Source of truth:
 *   Restaurant/Menu/Orders -> Dining API
 *   Wallet/Transactions    -> Wallet API
 *   Authentication         -> JWT
 *
 * localStorage is used ONLY for:
 *   - temporary cart persistence
 *
 * It is NOT used as the source of truth for:
 *   - wallet balance
 *   - wallet transactions
 *   - menu prices
 *   - order history
 *   - order status
 */

// ============================================================
// CONFIGURATION
// ============================================================

const API_BASE = "http://192.168.122.10:3000/api";

const restaurantCartKey = "restaurantCart";

let currentRestaurant = null;
let menuItems = [];
let restaurantCategories = [];

let restaurantCart = [];

let latestOrder = null;


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
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };
}


async function apiRequest(endpoint, options = {}) {
    const headers = getAuthHeaders();

    if (!headers) {
        throw new Error("AUTHENTICATION_REQUIRED");
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            ...headers,
            ...(options.headers || {})
        }
    });

    let data;

    try {
        data = await response.json();
    } catch {
        data = {
            status: "error",
            message: "The server returned an invalid response."
        };
    }

    if (!response.ok) {
        const error = new Error(
            data.message || `Request failed with status ${response.status}`
        );

        error.status = response.status;
        error.data = data;

        throw error;
    }

    return data;
}


// ============================================================
// AUTH ERROR HANDLING
// ============================================================

function handleApiError(error, fallbackMessage = "Something went wrong.") {
    console.error("Dining API error:", error);

    if (error.message === "AUTHENTICATION_REQUIRED") {
        showGlobalMessage(
            "Please log in before using Campus Dining.",
            true
        );

        return;
    }

    if (error.status === 401 || error.status === 403) {
        showGlobalMessage(
            "Your login session has expired. Please log in again.",
            true
        );

        return;
    }

    showGlobalMessage(
        error.message || fallbackMessage,
        true
    );
}


function showGlobalMessage(message, isError = false) {
    const checkoutMessage =
        document.getElementById("restaurantCheckoutMessage");

    if (checkoutMessage) {
        checkoutMessage.textContent = message;
        checkoutMessage.style.display = "block";
    }

    if (isError) {
        console.error(message);
    }
}


// ============================================================
// CART
// ============================================================

function loadRestaurantCart() {
    try {
        const saved = localStorage.getItem(restaurantCartKey);

        if (!saved) {
            restaurantCart = [];
            return;
        }

        const parsed = JSON.parse(saved);

        restaurantCart = Array.isArray(parsed)
            ? parsed
            : [];
    } catch (error) {
        console.error("Invalid restaurant cart:", error);
        restaurantCart = [];
    }
}


function saveRestaurantCart() {
    localStorage.setItem(
        restaurantCartKey,
        JSON.stringify(restaurantCart)
    );
}


function clearRestaurantCart() {
    restaurantCart.length = 0;
    saveRestaurantCart();
    renderRestaurantCart();
}


function addToRestaurantCart(menuItemId) {
    const product = menuItems.find(
        item => Number(item.menu_item_id) === Number(menuItemId)
    );

    if (!product) {
        console.error("Menu item not found:", menuItemId);
        return;
    }

    const existing = restaurantCart.find(
        item => Number(item.menu_item_id) === Number(menuItemId)
    );

    if (existing) {
        existing.quantity += 1;
    } else {
        restaurantCart.push({
            menu_item_id: Number(product.menu_item_id),
            name: product.name,
            price: Number(product.price),
            quantity: 1
        });
    }

    saveRestaurantCart();
    renderRestaurantCart();
}


function removeFromRestaurantCart(menuItemId) {
    const index = restaurantCart.findIndex(
        item => Number(item.menu_item_id) === Number(menuItemId)
    );

    if (index === -1) {
        return;
    }

    restaurantCart.splice(index, 1);

    saveRestaurantCart();
    renderRestaurantCart();
}


function changeRestaurantCartQuantity(menuItemId, change) {
    const item = restaurantCart.find(
        cartItem =>
            Number(cartItem.menu_item_id) === Number(menuItemId)
    );

    if (!item) {
        return;
    }

    item.quantity += change;

    if (item.quantity <= 0) {
        removeFromRestaurantCart(menuItemId);
        return;
    }

    saveRestaurantCart();
    renderRestaurantCart();
}


function calculateRestaurantCartTotal() {
    return restaurantCart.reduce(
        (total, item) =>
            total + (Number(item.price) * Number(item.quantity)),
        0
    );
}


function renderRestaurantCart() {
    const cartContainer =
        document.getElementById("restaurantCartItems");

    const totalElement =
        document.getElementById("restaurantCartTotal");

    if (!cartContainer || !totalElement) {
        return;
    }

    if (restaurantCart.length === 0) {
        cartContainer.innerHTML =
            "<p>Your cart is empty.</p>";

        totalElement.textContent = "R0.00";
        return;
    }

    cartContainer.replaceChildren();

    restaurantCart.forEach(item => {
        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";

        const info = document.createElement("div");

        const name = document.createElement("strong");
        name.textContent = item.name;

        const quantity = document.createElement("span");
        quantity.textContent =
            ` × ${item.quantity}`;

        info.append(name, quantity);

        const price = document.createElement("span");
        price.textContent =
            `R${(
                Number(item.price) *
                Number(item.quantity)
            ).toFixed(2)}`;

        const controls = document.createElement("div");
        controls.className = "cart-controls";

        const minusButton = document.createElement("button");
        minusButton.type = "button";
        minusButton.textContent = "−";
        minusButton.setAttribute(
            "aria-label",
            `Remove one ${item.name}`
        );

        minusButton.addEventListener(
            "click",
            () =>
                changeRestaurantCartQuantity(
                    item.menu_item_id,
                    -1
                )
        );

        const plusButton = document.createElement("button");
        plusButton.type = "button";
        plusButton.textContent = "+";
        plusButton.setAttribute(
            "aria-label",
            `Add one ${item.name}`
        );

        plusButton.addEventListener(
            "click",
            () =>
                changeRestaurantCartQuantity(
                    item.menu_item_id,
                    1
                )
        );

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Remove";

        removeButton.addEventListener(
            "click",
            () =>
                removeFromRestaurantCart(
                    item.menu_item_id
                )
        );

        controls.append(
            minusButton,
            plusButton,
            removeButton
        );

        cartItem.append(
            info,
            price,
            controls
        );

        cartContainer.appendChild(cartItem);
    });

    totalElement.textContent =
        `R${calculateRestaurantCartTotal().toFixed(2)}`;
}


// ============================================================
// RESTAURANT
// ============================================================

async function loadRestaurant() {
    const grid =
        document.getElementById("restaurantMenuGrid");

    if (grid) {
        grid.innerHTML =
            "<p>Loading campus dining...</p>";
    }

    try {
        const data =
            await apiRequest("/dining/restaurants");

        if (
            !data.restaurants ||
            !data.restaurants.length
        ) {
            throw new Error(
                "No dining restaurant is available for your campus."
            );
        }

        currentRestaurant = data.restaurants[0];

        updateRestaurantHeader();

        await Promise.all([
            loadRestaurantCategories(),
            loadRestaurantMenu()
        ]);

    } catch (error) {
        handleApiError(
            error,
            "Unable to load campus dining."
        );
    }
}


function updateRestaurantHeader() {
    if (!currentRestaurant) {
        return;
    }

    const title =
        document.getElementById("dining-title");

    const subtitle =
        document.querySelector(".dining-hero p");

    if (title) {
        title.textContent =
            currentRestaurant.name;
    }

    if (subtitle) {
        const location =
            currentRestaurant.location
                ? ` • ${currentRestaurant.location}`
                : "";

        subtitle.textContent =
            `${currentRestaurant.description || "Campus dining"}${location}`;
    }
}


// ============================================================
// CATEGORIES
// ============================================================

async function loadRestaurantCategories() {
    if (!currentRestaurant) {
        return;
    }

    try {
        const data =
            await apiRequest(
                `/dining/categories?restaurant_id=${encodeURIComponent(
                    currentRestaurant.restaurant_id
                )}`
            );

        restaurantCategories =
            Array.isArray(data.categories)
                ? data.categories
                : [];

        renderCategoryControls();

    } catch (error) {
        handleApiError(
            error,
            "Unable to load dining categories."
        );
    }
}


function renderCategoryControls() {
    /*
     * The existing HTML doesn't have a dedicated
     * category selector. We create one dynamically
     * without changing the existing page structure.
     */

    const menuSection =
        document.querySelector(".dining-container");

    if (!menuSection) {
        return;
    }

    const existing =
        document.getElementById("restaurantCategoryControls");

    if (existing) {
        existing.remove();
    }

    if (!restaurantCategories.length) {
        return;
    }

    const wrapper =
        document.createElement("div");

    wrapper.id =
        "restaurantCategoryControls";

    wrapper.className =
        "restaurant-category-controls";

    const label =
        document.createElement("label");

    label.setAttribute(
        "for",
        "restaurantCategorySelect"
    );

    label.textContent =
        "Filter by category";

    const select =
        document.createElement("select");

    select.id =
        "restaurantCategorySelect";

    const allOption =
        document.createElement("option");

    allOption.value = "";
    allOption.textContent = "All categories";

    select.appendChild(allOption);

    restaurantCategories.forEach(category => {
        const option =
            document.createElement("option");

        option.value =
            category.category_id;

        option.textContent =
            category.category_name;

        select.appendChild(option);
    });

    select.addEventListener(
        "change",
        () => {
            loadRestaurantMenu(
                select.value || ""
            );
        }
    );

    wrapper.append(label, select);

    const heading =
        document.getElementById("menu-title");

    if (heading) {
        heading.insertAdjacentElement(
            "afterend",
            wrapper
        );
    } else {
        menuSection.prepend(wrapper);
    }
}


// ============================================================
// MENU
// ============================================================

async function loadRestaurantMenu(categoryId = "") {
    if (!currentRestaurant) {
        return;
    }

    const grid =
        document.getElementById("restaurantMenuGrid");

    if (grid) {
        grid.innerHTML =
            "<p>Loading menu...</p>";
    }

    try {
        let endpoint =
            `/dining/menu?restaurant_id=${encodeURIComponent(
                currentRestaurant.restaurant_id
            )}`;

        if (categoryId) {
            endpoint +=
                `&category_id=${encodeURIComponent(categoryId)}`;
        }

        const data =
            await apiRequest(endpoint);

        menuItems =
            Array.isArray(data.menu)
                ? data.menu
                : [];

        syncCartWithCurrentMenu();

        renderRestaurantMenu();

    } catch (error) {
        handleApiError(
            error,
            "Unable to load the dining menu."
        );
    }
}


function syncCartWithCurrentMenu() {
    /*
     * Remove cart items that no longer exist
     * in the backend menu.
     */

    restaurantCart =
        restaurantCart.filter(cartItem =>
            menuItems.some(
                menuItem =>
                    Number(menuItem.menu_item_id) ===
                    Number(cartItem.menu_item_id)
            )
        );

    /*
     * Refresh prices/names from the server.
     */

    restaurantCart.forEach(cartItem => {
        const serverItem =
            menuItems.find(
                item =>
                    Number(item.menu_item_id) ===
                    Number(cartItem.menu_item_id)
            );

        if (serverItem) {
            cartItem.name =
                serverItem.name;

            cartItem.price =
                Number(serverItem.price);
        }
    });

    saveRestaurantCart();
    renderRestaurantCart();
}


function createMenuCard(product) {
    const card =
        document.createElement("article");

    card.className =
        "restaurant-card";

    const imageDiv =
        document.createElement("div");

    imageDiv.className =
        "rest-img";

    const img =
        document.createElement("img");

    /*
     * Backend image_url can be null.
     * Fall back to an existing local image
     * where appropriate.
     */
    img.src =
        product.image_url ||
        getLocalFoodImage(product.name);

    img.alt =
        product.name;

    img.className =
        "rest-card-img";

    img.loading =
        "lazy";

    imageDiv.appendChild(img);

    const info =
        document.createElement("div");

    info.className =
        "rest-info";

    const category =
        document.createElement("small");

    category.textContent =
        product.category_name || "";

    const name =
        document.createElement("h3");

    name.textContent =
        product.name;

    const description =
        document.createElement("p");

    description.className =
        "cuisine";

    description.textContent =
        product.description || "";

    const price =
        document.createElement("p");

    price.className =
        "price";

    price.textContent =
        `R${Number(product.price).toFixed(2)}`;

    const button =
        document.createElement("button");

    button.type =
        "button";

    button.className =
        "btn-menu";

    button.textContent =
        "Add to Order";

    button.addEventListener(
        "click",
        () =>
            addToRestaurantCart(
                product.menu_item_id
            )
    );

    info.append(
        category,
        name,
        description,
        price,
        button
    );

    card.append(
        imageDiv,
        info
    );

    return card;
}


function getLocalFoodImage(name) {
    const value =
        String(name || "").toLowerCase();

    if (value.includes("burger")) {
        return "cheesebugger.jpeg";
    }

    if (
        value.includes("coffee") ||
        value.includes("drink") ||
        value.includes("water")
    ) {
        return "Coffe.jpeg";
    }

    if (
        value.includes("energy") ||
        value.includes("soft")
    ) {
        return "Energy-drinks.jpeg";
    }

    if (
        value.includes("breakfast") ||
        value.includes("wrap") ||
        value.includes("roll")
    ) {
        return "fastfood.jpeg";
    }

    return "fastfood.jpeg";
}


function renderRestaurantMenu() {
    const grid =
        document.getElementById("restaurantMenuGrid");

    if (!grid) {
        return;
    }

    if (!menuItems.length) {
        grid.innerHTML =
            "<p>No menu items are currently available.</p>";

        return;
    }

    const fragment =
        document.createDocumentFragment();

    menuItems.forEach(product => {
        fragment.appendChild(
            createMenuCard(product)
        );
    });

    grid.replaceChildren(fragment);
}


// ============================================================
// WALLET
// ============================================================

async function loadRestaurantWallet() {
    try {
        const data =
            await apiRequest("/wallet");

        const wallet =
            data.wallet || data;

        const balance =
            Number(wallet.balance);

        updateRestaurantWalletDisplay(
            Number.isFinite(balance)
                ? balance
                : 0
        );

    } catch (error) {
        handleApiError(
            error,
            "Unable to load your wallet."
        );
    }
}


function updateRestaurantWalletDisplay(balance) {
    const balanceElement =
        document.getElementById(
            "restaurantWalletBalance"
        );

    if (!balanceElement) {
        return;
    }

    balanceElement.textContent =
        `R${Number(balance).toFixed(2)}`;
}


async function addRestaurantFunds(amount) {
    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        throw new Error(
            "Please enter a valid amount."
        );
    }

    const data =
        await apiRequest(
            "/wallet/top-up",
            {
                method: "POST",
                body: JSON.stringify({
                    amount: amount
                })
            }
        );

    return data;
}


// ============================================================
// TRANSACTION HISTORY
// ============================================================

async function loadRestaurantTransactionHistory() {
    const historyContainer =
        document.getElementById(
            "restaurantTransactionHistory"
        );

    if (historyContainer) {
        historyContainer.innerHTML =
            "<p>Loading transactions...</p>";
    }

    try {
        const data =
            await apiRequest(
                "/wallet/transactions"
            );

        const transactions =
            Array.isArray(data.transactions)
                ? data.transactions
                : [];

        renderRestaurantTransactionHistory(
            transactions
        );

    } catch (error) {
        handleApiError(
            error,
            "Unable to load transaction history."
        );
    }
}


function renderRestaurantTransactionHistory(
    transactions
) {
    const historyContainer =
        document.getElementById(
            "restaurantTransactionHistory"
        );

    if (!historyContainer) {
        return;
    }

    if (!transactions.length) {
        historyContainer.innerHTML =
            "<p>No transactions yet.</p>";

        return;
    }

    historyContainer.replaceChildren();

    transactions.forEach(transaction => {
        const item =
            document.createElement("article");

        item.className =
            "transaction-item";

        const info =
            document.createElement("div");

        info.className =
            "transaction-info";

        const type =
            document.createElement("strong");

        const transactionType =
            String(
                transaction.transaction_type ||
                transaction.type ||
                ""
            ).toLowerCase();

        if (transactionType === "top_up") {
            type.textContent =
                "Wallet Top-up";
        } else if (transactionType === "purchase") {
            type.textContent =
                transaction.reference_type === "dining_order"
                    ? "Dining Order"
                    : "Purchase";
        } else if (transactionType === "refund") {
            type.textContent =
                "Refund";
        } else {
            type.textContent =
                transaction.transaction_type ||
                "Wallet Transaction";
        }

        const date =
            document.createElement("small");

        const createdAt =
            transaction.created_at ||
            transaction.date;

        date.textContent =
            createdAt
                ? new Date(createdAt).toLocaleString()
                : "";

        info.append(type, date);

        const amount =
            document.createElement("strong");

        const numericAmount =
            Number(transaction.amount || 0);

        const isCredit =
            transactionType === "top_up" ||
            transactionType === "refund";

        amount.textContent =
            `${isCredit ? "+" : "-"}R${Math.abs(
                numericAmount
            ).toFixed(2)}`;

        amount.className =
            isCredit
                ? "transaction-credit"
                : "transaction-debit";

        item.append(
            info,
            amount
        );

        historyContainer.appendChild(item);
    });
}


// ============================================================
// DINING ORDER CREATION + PAYMENT
// ============================================================

async function createDiningOrder() {
    if (!currentRestaurant) {
        throw new Error(
            "Your campus restaurant could not be identified."
        );
    }

    if (!restaurantCart.length) {
        throw new Error(
            "Your cart is empty."
        );
    }

    /*
     * IMPORTANT:
     * We send only menu_item_id + quantity.
     *
     * We deliberately DO NOT send:
     * - price
     * - subtotal
     * - total
     *
     * The backend calculates those values from MySQL.
     */

    const items =
        restaurantCart.map(item => ({
            menu_item_id:
                Number(item.menu_item_id),

            quantity:
                Number(item.quantity)
        }));

    const data =
        await apiRequest(
            "/dining/orders",
            {
                method: "POST",
                body: JSON.stringify({
                    restaurant_id:
                        Number(
                            currentRestaurant.restaurant_id
                        ),

                    items
                })
            }
        );

    return data.order;
}


async function payDiningOrder(orderId) {
    if (!orderId) {
        throw new Error(
            "Invalid dining order ID."
        );
    }

    const data =
        await apiRequest(
            `/dining/orders/${encodeURIComponent(
                orderId
            )}/pay`,
            {
                method: "POST"
            }
        );

    return data.payment;
}


async function restaurantCheckout() {
    const checkoutMessage =
        document.getElementById(
            "restaurantCheckoutMessage"
        );

    const checkoutButton =
        document.getElementById(
            "restaurantCheckoutBtn"
        );

    if (checkoutMessage) {
        checkoutMessage.textContent =
            "";
    }

    if (!restaurantCart.length) {
        if (checkoutMessage) {
            checkoutMessage.textContent =
                "Your cart is empty.";
        }

        return;
    }

    if (checkoutButton) {
        checkoutButton.disabled =
            true;

        checkoutButton.textContent =
            "Processing...";
    }

    try {
        /*
         * Step 1:
         * Create the order.
         *
         * Backend calculates the real total.
         */
        const order =
            await createDiningOrder();

        latestOrder =
            order;

        /*
         * Step 2:
         * Pay the order using the server-side wallet.
         */
        const payment =
            await payDiningOrder(
                order.order_id
            );

        /*
         * Step 3:
         * Clear local cart only AFTER
         * successful backend payment.
         */
        clearRestaurantCart();

        /*
         * Step 4:
         * Refresh authoritative wallet
         * and transaction data.
         */
        await Promise.all([
            loadRestaurantWallet(),
            loadRestaurantTransactionHistory(),
            loadRestaurantOrderHistory()
        ]);

        if (checkoutMessage) {
            checkoutMessage.textContent =
                `Order #${order.order_id} confirmed. ` +
                `R${Number(payment.amount_paid).toFixed(2)} paid successfully.`;
        }

        showOrderStatus(order);

    } catch (error) {
        handleApiError(
            error,
            "Unable to place your dining order."
        );

    } finally {
        if (checkoutButton) {
            checkoutButton.disabled =
                false;

            checkoutButton.textContent =
                "Place Order";
        }
    }
}


// ============================================================
// REAL ORDER STATUS
// ============================================================

function normaliseOrderStatus(status) {
    return String(status || "")
        .trim()
        .toLowerCase();
}


function showOrderStatus(order) {
    const section =
        document.getElementById(
            "orderStatusSection"
        );

    const statusPlaced =
        document.getElementById(
            "statusPlaced"
        );

    const statusPreparing =
        document.getElementById(
            "statusPreparing"
        );

    const statusReady =
        document.getElementById(
            "statusReady"
        );

    const statusMessage =
        document.getElementById(
            "orderStatusMessage"
        );

    if (!section || !order) {
        return;
    }

    section.style.display =
        "block";

    const status =
        normaliseOrderStatus(
            order.status
        );

    /*
     * Reset UI.
     */
    [
        statusPlaced,
        statusPreparing,
        statusReady
    ].forEach(element => {
        if (!element) {
            return;
        }

        element.classList.remove(
            "active"
        );

        element.classList.add(
            "dimmed"
        );
    });

    const dividers =
        document.querySelectorAll(
            ".status-divider"
        );

    dividers.forEach(divider => {
        divider.classList.remove(
            "filled"
        );
    });

    /*
     * Confirmed/pending/processing:
     * order has been placed.
     */
    if (
        [
            "pending",
            "confirmed",
            "processing"
        ].includes(status)
    ) {
        activateStatusStep(
            statusPlaced
        );

        if (statusMessage) {
            statusMessage.textContent =
                status === "pending"
                    ? "Your order has been placed and is awaiting payment."
                    : "Your order has been received.";
        }
    }

    /*
     * Preparing.
     */
    if (
        status === "processing"
    ) {
        activateStatusStep(
            statusPreparing
        );

        if (dividers[0]) {
            dividers[0].classList.add(
                "filled"
            );
        }

        if (statusMessage) {
            statusMessage.textContent =
                "The kitchen is preparing your order.";
        }
    }

    /*
     * Ready.
     */
    if (
        status === "ready"
    ) {
        activateStatusStep(
            statusPreparing
        );

        activateStatusStep(
            statusReady
        );

        if (dividers[0]) {
            dividers[0].classList.add(
                "filled"
            );
        }

        if (dividers[1]) {
            dividers[1].classList.add(
                "filled"
            );
        }

        if (statusMessage) {
            statusMessage.textContent =
                "Your order is ready for collection!";
        }
    }

    /*
     * Completed.
     */
    if (
        status === "completed"
    ) {
        activateStatusStep(
            statusPreparing
        );

        activateStatusStep(
            statusReady
        );

        if (dividers[0]) {
            dividers[0].classList.add(
                "filled"
            );
        }

        if (dividers[1]) {
            dividers[1].classList.add(
                "filled"
            );
        }

        if (statusMessage) {
            statusMessage.textContent =
                "Your dining order has been completed.";
        }
    }

    /*
     * Cancelled.
     */
    if (
        status === "cancelled"
    ) {
        if (statusMessage) {
            statusMessage.textContent =
                "This dining order was cancelled.";
        }
    }

    section.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


function activateStatusStep(element) {
    if (!element) {
        return;
    }

    element.classList.remove(
        "dimmed"
    );

    element.classList.add(
        "active"
    );
}


// ============================================================
// ORDER HISTORY
// ============================================================

let cachedDiningOrders = [];


async function loadRestaurantOrderHistory() {
    const tbody =
        document.getElementById(
            "restaurantOrderHistoryBody"
        );

    if (tbody) {
        tbody.innerHTML =
            `<tr>
                <td colspan="8" style="padding:20px;text-align:center;">
                    Loading orders...
                </td>
            </tr>`;
    }

    try {
        const data =
            await apiRequest(
                "/dining/orders"
            );

        cachedDiningOrders =
            Array.isArray(data.orders)
                ? data.orders
                : [];

        renderRestaurantOrderHistory();

    } catch (error) {
        handleApiError(
            error,
            "Unable to load dining order history."
        );
    }
}


function getOrderDate(order) {
    return (
        order.created_at ||
        order.order_date ||
        order.date ||
        ""
    );
}


function getOrderLastUpdate(order) {
    return (
        order.updated_at ||
        order.last_update ||
        order.created_at ||
        ""
    );
}


function getOrderReference(order) {
    return (
        order.reference ||
        order.order_reference ||
        `DINING-${order.order_id}`
    );
}


function getOrderQuantity(order) {
    if (
        Array.isArray(order.items)
    ) {
        return order.items.reduce(
            (total, item) =>
                total +
                Number(
                    item.quantity || 0
                ),
            0
        );
    }

    return Number(
        order.quantity || 0
    );
}


function renderRestaurantOrderHistory() {
    const tbody =
        document.getElementById(
            "restaurantOrderHistoryBody"
        );

    if (!tbody) {
        return;
    }

    const fromDate =
        document.getElementById(
            "restaurantOrderFromDate"
        )?.value || "";

    const toDate =
        document.getElementById(
            "restaurantOrderToDate"
        )?.value || "";

    const statusFilter =
        document.getElementById(
            "restaurantOrderStatus"
        )?.value || "all";

    const referenceFilter =
        (
            document.getElementById(
                "restaurantOrderReference"
            )?.value || ""
        )
            .trim()
            .toLowerCase();

    const rows =
        cachedDiningOrders.filter(order => {
            const rawDate =
                getOrderDate(order);

            const date =
                rawDate
                    ? new Date(rawDate)
                        .toISOString()
                        .slice(0, 10)
                    : "";

            const status =
                normaliseOrderStatus(
                    order.status
                );

            const filterStatus =
                normaliseOrderStatus(
                    statusFilter
                );

            const reference =
                getOrderReference(
                    order
                ).toLowerCase();

            const id =
                String(
                    order.order_id
                ).toLowerCase();

            const matchesFrom =
                !fromDate ||
                date >= fromDate;

            const matchesTo =
                !toDate ||
                date <= toDate;

            const matchesStatus =
                statusFilter === "all" ||
                filterStatus === status;

            const matchesReference =
                !referenceFilter ||
                reference.includes(
                    referenceFilter
                ) ||
                id.includes(
                    referenceFilter
                );

            return (
                matchesFrom &&
                matchesTo &&
                matchesStatus &&
                matchesReference
            );
        });

    if (!rows.length) {
        tbody.innerHTML =
            `<tr>
                <td colspan="8"
                    style="padding:20px;color:#64748b;text-align:center;">
                    No matching orders found.
                </td>
            </tr>`;

        return;
    }

    tbody.innerHTML =
        rows.map(order => {
            const date =
                getOrderDate(order);

            const deliveryDate =
                order.delivery_date ||
                order.deliveryDate ||
                "";

            const total =
                Number(
                    order.total_amount || 0
                );

            const quantity =
                getOrderQuantity(
                    order
                );

            const lastUpdate =
                getOrderLastUpdate(
                    order
                );

            return `
                <tr>
                    <td>${escapeHtml(order.order_id)}</td>

                    <td>
                        ${formatDate(date)}
                    </td>

                    <td>
                        ${deliveryDate
                            ? formatDate(deliveryDate)
                            : "—"}
                    </td>

                    <td>
                        R${total.toFixed(2)}
                    </td>

                    <td>
                        ${quantity}
                    </td>

                    <td>
                        ${formatDate(lastUpdate)}
                    </td>

                    <td>
                        <button
                            type="button"
                            class="view-btn"
                            data-order-id="${escapeHtml(order.order_id)}">
                            View
                        </button>
                    </td>

                    <td>
                        <button
                            type="button"
                            class="reorder-btn"
                            data-order-id="${escapeHtml(order.order_id)}">
                            Re-order
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

    tbody.querySelectorAll(
        ".view-btn"
    ).forEach(button => {
        button.addEventListener(
            "click",
            () =>
                viewDiningOrder(
                    button.dataset.orderId
                )
        );
    });

    tbody.querySelectorAll(
        ".reorder-btn"
    ).forEach(button => {
        button.addEventListener(
            "click",
            () =>
                reorderDiningOrder(
                    button.dataset.orderId
                )
        );
    });
}


// ============================================================
// VIEW REAL ORDER
// ============================================================

async function viewDiningOrder(orderId) {
    try {
        const data =
            await apiRequest(
                `/dining/orders/${encodeURIComponent(
                    orderId
                )}`
            );

        const order =
            data.order;

        if (!order) {
            throw new Error(
                "Order details were not returned."
            );
        }

        const items =
            Array.isArray(order.items)
                ? order.items
                : [];

        const itemText =
            items.length
                ? items.map(item =>
                    `${item.name || "Item"} x${item.quantity}`
                ).join(", ")
                : "No items";

        alert(
            `Dining Order #${order.order_id}\n` +
            `Status: ${order.status}\n` +
            `Restaurant: ${order.restaurant_name || currentRestaurant?.name || "Campus Dining"}\n` +
            `Total: R${Number(order.total_amount || 0).toFixed(2)}\n` +
            `Items: ${itemText}`
        );

        showOrderStatus(
            order
        );

    } catch (error) {
        handleApiError(
            error,
            "Unable to load order details."
        );
    }
}


// ============================================================
// REAL RE-ORDER
// ============================================================

async function reorderDiningOrder(orderId) {
    try {
        const data =
            await apiRequest(
                `/dining/orders/${encodeURIComponent(
                    orderId
                )}`
            );

        const order =
            data.order;

        if (
            !order ||
            !Array.isArray(order.items)
        ) {
            throw new Error(
                "Order items could not be loaded."
            );
        }

        /*
         * Verify every item against the current
         * server menu before adding it.
         */
        let addedCount = 0;

        for (const oldItem of order.items) {
            const currentItem =
                menuItems.find(
                    item =>
                        Number(
                            item.menu_item_id
                        ) ===
                        Number(
                            oldItem.menu_item_id
                        )
                );

            if (!currentItem) {
                continue;
            }

            const quantity =
                Number(
                    oldItem.quantity
                );

            if (
                !Number.isInteger(quantity) ||
                quantity <= 0
            ) {
                continue;
            }

            const existing =
                restaurantCart.find(
                    item =>
                        Number(
                            item.menu_item_id
                        ) ===
                        Number(
                            currentItem.menu_item_id
                        )
                );

            if (existing) {
                existing.quantity +=
                    quantity;

            } else {
                restaurantCart.push({
                    menu_item_id:
                        Number(
                            currentItem.menu_item_id
                        ),

                    name:
                        currentItem.name,

                    price:
                        Number(
                            currentItem.price
                        ),

                    quantity
                });
            }

            addedCount +=
                quantity;
        }

        saveRestaurantCart();
        renderRestaurantCart();

        if (addedCount > 0) {
            showGlobalMessage(
                `${addedCount} item(s) added back to your order.`
            );

            document
                .getElementById(
                    "restaurantCartItems"
                )
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

        } else {
            showGlobalMessage(
                "None of the items from that order are currently available."
            );
        }

    } catch (error) {
        handleApiError(
            error,
            "Unable to reorder this dining order."
        );
    }
}


// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (Number.isNaN(
        date.getTime()
    )) {
        return String(value);
    }

    return date.toLocaleString();
}


function escapeHtml(value) {
    return String(
        value ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ============================================================
// EVENT LISTENERS
// ============================================================

function setupRestaurantEventListeners() {
    const addFundsButton =
        document.getElementById(
            "restaurantAddFundsBtn"
        );

    const topupInput =
        document.getElementById(
            "restaurantTopupAmount"
        );

    const walletMessage =
        document.getElementById(
            "restaurantWalletMessage"
        );

    if (addFundsButton) {
        addFundsButton.addEventListener(
            "click",
            async () => {
                const amount =
                    Number(
                        topupInput?.value
                    );

                if (
                    !Number.isFinite(amount) ||
                    amount <= 0
                ) {
                    if (walletMessage) {
                        walletMessage.textContent =
                            "Please enter a valid amount.";
                    }

                    return;
                }

                addFundsButton.disabled =
                    true;

                addFundsButton.textContent =
                    "Adding...";

                try {
                    const data =
                        await addRestaurantFunds(
                            amount
                        );

                    const wallet =
                        data.wallet ||
                        data;

                    const balance =
                        Number(
                            wallet.balance
                        );

                    updateRestaurantWalletDisplay(
                        balance
                    );

                    await loadRestaurantTransactionHistory();

                    if (walletMessage) {
                        walletMessage.textContent =
                            `R${amount.toFixed(2)} added successfully.`;
                    }

                    if (topupInput) {
                        topupInput.value =
                            "";
                    }

                } catch (error) {
                    handleApiError(
                        error,
                        "Unable to add funds."
                    );

                } finally {
                    addFundsButton.disabled =
                        false;

                    addFundsButton.textContent =
                        "Add Funds";
                }
            }
        );
    }


    const checkoutButton =
        document.getElementById(
            "restaurantCheckoutBtn"
        );

    if (checkoutButton) {
        checkoutButton.addEventListener(
            "click",
            restaurantCheckout
        );
    }


    const searchButton =
        document.getElementById(
            "restaurantOrderSearchBtn"
        );

    if (searchButton) {
        searchButton.addEventListener(
            "click",
            renderRestaurantOrderHistory
        );
    }


    const clearButton =
        document.getElementById(
            "restaurantOrderClearBtn"
        );

    if (clearButton) {
        clearButton.addEventListener(
            "click",
            () => {
                const fromDate =
                    document.getElementById(
                        "restaurantOrderFromDate"
                    );

                const toDate =
                    document.getElementById(
                        "restaurantOrderToDate"
                    );

                const status =
                    document.getElementById(
                        "restaurantOrderStatus"
                    );

                const reference =
                    document.getElementById(
                        "restaurantOrderReference"
                    );

                if (fromDate) {
                    fromDate.value = "";
                }

                if (toDate) {
                    toDate.value = "";
                }

                if (status) {
                    status.value = "all";
                }

                if (reference) {
                    reference.value = "";
                }

                renderRestaurantOrderHistory();
            }
        );
    }


    [
        "restaurantOrderFromDate",
        "restaurantOrderToDate",
        "restaurantOrderStatus",
        "restaurantOrderReference"
    ].forEach(id => {
        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        element.addEventListener(
            "input",
            renderRestaurantOrderHistory
        );

        element.addEventListener(
            "change",
            renderRestaurantOrderHistory
        );
    });
}


// ============================================================
// STARTUP
// ============================================================

async function initialiseRestaurantPage() {
    const token =
        getAuthToken();

    if (!token) {
        showGlobalMessage(
            "Please log in to access Campus Dining.",
            true
        );

        return;
    }

    loadRestaurantCart();
    renderRestaurantCart();

    setupRestaurantEventListeners();

    /*
     * Load all authoritative backend data.
     */
    await Promise.all([
        loadRestaurant(),
        loadRestaurantWallet(),
        loadRestaurantTransactionHistory(),
        loadRestaurantOrderHistory()
    ]);
}


document.addEventListener(
    "DOMContentLoaded",
    initialiseRestaurantPage
);
