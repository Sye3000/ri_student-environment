// ============================================================
// RI STUDENT ENVIRONMENT — STORE FRONTEND
// Real API integration: Products + Wallet + Orders + Payments
// ============================================================

const API_BASE = "http://192.168.122.10:3000/api";

const cartKey = "storeCart";
let cart = loadCart();

let currentProducts = [];
let currentCategories = [];
let currentStudent = null;
let currentStoreOrders = [];

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

function requireAuthentication() {
    const token = getAuthToken();

    if (!token) {
        showGlobalMessage("Please log in before using the University Store.", true);
        return false;
    }

    return true;
}

// ============================================================
// API HELPER
// ============================================================

async function apiRequest(endpoint, options = {}) {
    const headers = getAuthHeaders();

    if (!headers) {
        throw new Error("Authentication token required");
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
            message: "Server returned an invalid response."
        };
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            `Request failed with status ${response.status}`
        );
    }

    return data;
}

// ============================================================
// GENERAL UI MESSAGE
// ============================================================

function showGlobalMessage(message, isError = false) {
    console[isError ? "error" : "log"](message);

    const checkoutMessage = document.getElementById("checkoutMessage");

    if (checkoutMessage) {
        checkoutMessage.textContent = message;
        checkoutMessage.style.color = isError ? "#b91c1c" : "";
    }
}

// ============================================================
// CART
// ============================================================

function loadCart() {
    try {
        const saved = localStorage.getItem(cartKey);

        if (!saved) {
            return [];
        }

        const parsed = JSON.parse(saved);

        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Unable to load cart:", error);
        return [];
    }
}

function saveCart() {
    localStorage.setItem(cartKey, JSON.stringify(cart));
}

function clearCart() {
    cart.length = 0;
    saveCart();
    renderCart();
}

function addToCart(productId) {
    const product = currentProducts.find(
        item => Number(item.product_id ?? item.id) === Number(productId)
    );

    if (!product) {
        showGlobalMessage("Product is no longer available.", true);
        return;
    }

    const id = Number(product.product_id ?? product.id);

    const name =
        product.product_name ??
        product.name ??
        "Product";

    const price = Number(
        product.price ??
        product.unit_price ??
        0
    );

    const existingItem = cart.find(
        item => Number(item.id) === id
    );

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id,
            name,
            price,
            quantity: 1,
            image: product.image_url || product.image || ""
        });
    }

    saveCart();
    renderCart();

    showGlobalMessage(`${name} added to your cart.`);
}

function removeFromCart(productId) {
    const index = cart.findIndex(
        item => Number(item.id) === Number(productId)
    );

    if (index === -1) {
        return;
    }

    cart.splice(index, 1);

    saveCart();
    renderCart();
}

function changeCartQuantity(productId, change) {
    const item = cart.find(
        cartItem => Number(cartItem.id) === Number(productId)
    );

    if (!item) {
        return;
    }

    item.quantity += change;

    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }

    saveCart();
    renderCart();
}

function calculateCartTotal() {
    return cart.reduce(
        (total, item) =>
            total + Number(item.price) * Number(item.quantity),
        0
    );
}

function calculateCartQuantity() {
    return cart.reduce(
        (total, item) =>
            total + Number(item.quantity),
        0
    );
}

function renderCart() {
    const cartContainer = document.getElementById("cartItems");
    const totalElement = document.getElementById("cartTotal");

    if (!cartContainer || !totalElement) {
        return;
    }

    if (!cart.length) {
        cartContainer.innerHTML = "<p>Your cart is empty.</p>";
        totalElement.textContent = "R0.00";
        return;
    }

    cartContainer.replaceChildren();

    cart.forEach(item => {
        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";

        const itemInfo = document.createElement("div");

        const itemName = document.createElement("strong");
        itemName.textContent = item.name;

        const quantity = document.createElement("span");
        quantity.textContent = ` × ${item.quantity}`;

        itemInfo.append(itemName, quantity);

        const itemPrice = document.createElement("span");
        itemPrice.textContent =
            `R${(Number(item.price) * Number(item.quantity)).toFixed(2)}`;

        const controls = document.createElement("div");
        controls.className = "cart-item-controls";

        const decreaseButton = document.createElement("button");
        decreaseButton.type = "button";
        decreaseButton.textContent = "−";
        decreaseButton.setAttribute("aria-label", `Decrease ${item.name}`);
        decreaseButton.addEventListener(
            "click",
            () => changeCartQuantity(item.id, -1)
        );

        const increaseButton = document.createElement("button");
        increaseButton.type = "button";
        increaseButton.textContent = "+";
        increaseButton.setAttribute("aria-label", `Increase ${item.name}`);
        increaseButton.addEventListener(
            "click",
            () => changeCartQuantity(item.id, 1)
        );

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Remove";
        removeButton.addEventListener(
            "click",
            () => removeFromCart(item.id)
        );

        controls.append(
            decreaseButton,
            increaseButton,
            removeButton
        );

        cartItem.append(
            itemInfo,
            itemPrice,
            controls
        );

        cartContainer.appendChild(cartItem);
    });

    totalElement.textContent =
        `R${calculateCartTotal().toFixed(2)}`;
}

// ============================================================
// PRODUCTS
// ============================================================

function normalizeProduct(product) {
    return {
        id: Number(product.product_id ?? product.id),
        product_id: Number(product.product_id ?? product.id),

        name:
            product.product_name ??
            product.name ??
            "Unnamed Product",

        product_name:
            product.product_name ??
            product.name ??
            "Unnamed Product",

        price: Number(
            product.price ??
            product.unit_price ??
            0
        ),

        category:
            product.category_name ??
            product.category ??
            product.cat ??
            "General",

        category_id:
            product.category_id ??
            null,

        description:
            product.description ??
            "",

        image:
            product.image_url ??
            product.image ??
            "",

        image_url:
            product.image_url ??
            product.image ??
            "",

        inventory:
            Number(
                product.inventory_quantity ??
                product.quantity_available ??
                product.stock ??
                product.quantity ??
                0
            ),

        stock:
            Number(
                product.inventory_quantity ??
                product.quantity_available ??
                product.stock ??
                product.quantity ??
                0
            )
    };
}

async function loadProducts() {
    const grid = document.getElementById("productGrid");

    if (grid) {
        grid.innerHTML = "<p>Loading products...</p>";
    }

    try {
        const data = await apiRequest("/store/products");

        const products =
            Array.isArray(data.products)
                ? data.products
                : Array.isArray(data.data)
                    ? data.data
                    : Array.isArray(data)
                        ? data
                        : [];

        currentProducts = products.map(normalizeProduct);

        renderProducts("all");

    } catch (error) {
        console.error("Failed to load products:", error);

        if (grid) {
            grid.innerHTML =
                `<p>Unable to load store products: ${error.message}</p>`;
        }
    }
}

// ============================================================
// CATEGORIES
// ============================================================

function setupCategories(categories) {
    const container =
        document.querySelector(".categories");

    if (!container) {
        return;
    }

    container.replaceChildren();

    const allButton =
        document.createElement("button");

    allButton.type = "button";
    allButton.className = "category-btn active";
    allButton.dataset.category = "all";
    allButton.setAttribute("aria-pressed", "true");
    allButton.textContent = "All";

    container.appendChild(allButton);

    categories.forEach(category => {
        const categoryId =
            category.category_id ??
            category.id;

        const categoryName =
            category.category_name ??
            category.name ??
            category.category ??
            "Category";

        const button =
            document.createElement("button");

        button.type = "button";
        button.className = "category-btn";
        button.dataset.categoryId = categoryId;
        button.dataset.category = String(categoryId);
        button.setAttribute("aria-pressed", "false");
        button.textContent = categoryName;

        container.appendChild(button);
    });

    container.querySelectorAll(".category-btn")
        .forEach(button => {
            button.addEventListener("click", () => {
                container
                    .querySelectorAll(".category-btn")
                    .forEach(categoryButton => {
                        const selected =
                            categoryButton === button;

                        categoryButton.classList.toggle(
                            "active",
                            selected
                        );

                        categoryButton.setAttribute(
                            "aria-pressed",
                            String(selected)
                        );
                    });

                renderProducts(button.dataset.category);
            });
        });
}

async function loadCategories() {
    try {
        const data =
            await apiRequest("/store/categories");

        const categories =
            Array.isArray(data.categories)
                ? data.categories
                : Array.isArray(data.data)
                    ? data.data
                    : Array.isArray(data)
                        ? data
                        : [];

        currentCategories = categories;

        setupCategories(categories);

    } catch (error) {
        console.error("Failed to load categories:", error);

        /*
         * Don't destroy the existing category UI if the API
         * temporarily fails.
         */
    }
}

// ============================================================
// PRODUCT CARD
// ============================================================

function getProductImage(product) {
    if (product.image_url) {
        return product.image_url;
    }

    if (product.image) {
        return product.image;
    }

    const name = product.name.toLowerCase();

    if (name.includes("hoodie")) {
        return "Hoodies.jpeg";
    }

    if (name.includes("t-shirt") || name.includes("shirt")) {
        return "Hoodies.jpeg";
    }

    return "Hoodies.jpeg";
}

function createProductCard(product) {
    const card =
        document.createElement("article");

    card.className = "product-card";
    card.dataset.category =
        String(product.category_id ?? product.category);

    const imageWrap =
        document.createElement("div");

    imageWrap.className = "product-image";
    imageWrap.setAttribute("aria-hidden", "true");

    const img =
        document.createElement("img");

    img.src = getProductImage(product);
    img.alt = product.name;
    img.className = "product-img";

    img.onerror = () => {
        img.style.display = "none";
    };

    imageWrap.appendChild(img);

    const meta =
        document.createElement("div");

    meta.className = "product-meta";
    meta.textContent = product.category;

    const name =
        document.createElement("h3");

    name.textContent = product.name;

    const description =
        document.createElement("p");

    description.textContent =
        product.description ||
        "Official RI student product.";

    const priceRow =
        document.createElement("div");

    priceRow.className =
        "product-price-row";

    const price =
        document.createElement("span");

    price.className = "price";

    price.textContent =
        `R${product.price.toFixed(2)}`;

    const button =
        document.createElement("button");

    button.type = "button";
    button.className = "btn-menu";

    const stock =
        Number(product.stock);

    if (stock <= 0) {
        button.textContent = "Out of stock";
        button.disabled = true;
    } else {
        button.textContent = "Add to cart";

        button.addEventListener(
            "click",
            () => addToCart(product.id)
        );
    }

    priceRow.append(
        price,
        button
    );

    card.append(
        imageWrap,
        meta,
        name,
        description,
        priceRow
    );

    return card;
}

function renderProducts(category = "all") {
    const grid =
        document.getElementById("productGrid");

    if (!grid) {
        return;
    }

    let filtered = currentProducts;

    if (category !== "all") {
        filtered = currentProducts.filter(product => {
            return (
                String(product.category_id) ===
                    String(category) ||
                String(product.category).toLowerCase() ===
                    String(category).toLowerCase()
            );
        });
    }

    if (!filtered.length) {
        grid.innerHTML =
            "<p>No products available in this category.</p>";
        return;
    }

    const fragment =
        document.createDocumentFragment();

    filtered.forEach(product => {
        fragment.appendChild(
            createProductCard(product)
        );
    });

    grid.replaceChildren(fragment);
}

// ============================================================
// WALLET
// ============================================================

async function loadWallet() {
    const balanceElement =
        document.getElementById("walletBalance");

    try {
        const data =
            await apiRequest("/wallet");

        const wallet =
            data.wallet ||
            data.data ||
            data;

        const balance =
            Number(
                wallet.balance ??
                wallet.current_balance ??
                0
            );

        if (balanceElement) {
            balanceElement.textContent =
                `R${balance.toFixed(2)}`;
        }

        return balance;

    } catch (error) {
        console.error("Failed to load wallet:", error);

        if (balanceElement) {
            balanceElement.textContent =
                "Unavailable";
        }

        return null;
    }
}

async function topUpWallet() {
    const input =
        document.getElementById("topupAmount");

    const message =
        document.getElementById("walletMessage");

    if (!input || !message) {
        return;
    }

    const amount =
        Number(input.value);

    if (!Number.isFinite(amount) || amount <= 0) {
        message.textContent =
            "Please enter a valid amount.";
        return;
    }

    const button =
        document.getElementById("addFundsBtn");

    if (button) {
        button.disabled = true;
    }

    message.textContent =
        "Processing wallet top-up...";

    try {
        const data =
            await apiRequest(
                "/wallet/top-up",
                {
                    method: "POST",
                    body: JSON.stringify({
                        amount
                    })
                }
            );

        message.textContent =
            data.message ||
            `R${amount.toFixed(2)} added successfully.`;

        input.value = "";

        await loadWallet();
        await loadTransactions();

    } catch (error) {
        console.error("Wallet top-up failed:", error);

        message.textContent =
            `Top-up failed: ${error.message}`;

    } finally {
        if (button) {
            button.disabled = false;
        }
    }
}

// ============================================================
// TRANSACTIONS
// ============================================================

async function loadTransactions() {
    const container =
        document.getElementById("transactionHistory");

    if (!container) {
        return;
    }

    try {
        const data =
            await apiRequest(
                "/wallet/transactions"
            );

        const transactions =
            Array.isArray(data.transactions)
                ? data.transactions
                : Array.isArray(data.data)
                    ? data.data
                    : [];

        renderTransactionHistory(transactions);

    } catch (error) {
        console.error(
            "Failed to load transactions:",
            error
        );

        container.innerHTML =
            "<p>Unable to load transaction history.</p>";
    }
}

function renderTransactionHistory(transactions) {
    const container =
        document.getElementById("transactionHistory");

    if (!container) {
        return;
    }

    if (!transactions.length) {
        container.innerHTML =
            "<p>No transactions yet.</p>";
        return;
    }

    container.replaceChildren();

    [...transactions]
        .reverse()
        .forEach(transaction => {
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
                    transaction.transaction_type ??
                    transaction.type ??
                    ""
                ).toLowerCase();

            if (
                transactionType === "top_up" ||
                transactionType === "top-up"
            ) {
                type.textContent =
                    "Wallet Top-up";
            } else if (
                transactionType === "purchase"
            ) {
                type.textContent =
                    "Store Purchase";
            } else {
                type.textContent =
                    transaction.transaction_type ??
                    transaction.type ??
                    "Transaction";
            }

            const date =
                document.createElement("small");

            const dateValue =
                transaction.created_at ??
                transaction.date;

            date.textContent =
                dateValue
                    ? new Date(dateValue).toLocaleString()
                    : "";

            info.append(
                type,
                date
            );

            const amount =
                document.createElement("strong");

            const numericAmount =
                Number(
                    transaction.amount ?? 0
                );

            const isCredit =
                transactionType === "top_up" ||
                transactionType === "top-up";

            amount.textContent =
                `${isCredit ? "+" : "-"}R${numericAmount.toFixed(2)}`;

            amount.className =
                isCredit
                    ? "transaction-credit"
                    : "transaction-debit";

            item.append(
                info,
                amount
            );

            container.appendChild(item);
        });
}

// ============================================================
// ACCOUNT DASHBOARD
// ============================================================

async function loadStudentProfile() {
    try {
        const data =
            await apiRequest(
                "/students/profile"
            );

        currentStudent =
            data.student ||
            data.data ||
            data;

        renderAccountDashboard();

    } catch (error) {
        console.error(
            "Failed to load student profile:",
            error
        );

        /*
         * Fall back to the locally cached student
         * only for display purposes.
         */
        renderAccountDashboard();
    }
}

function renderAccountDashboard() {
    const localStudent =
        (() => {
            try {
                return JSON.parse(
                    localStorage.getItem("ri_student") ||
                    "null"
                );
            } catch {
                return null;
            }
        })();

    const student =
        currentStudent ||
        localStudent;

    const badge =
        document.getElementById(
            "accountProfileBadge"
        );

    const studentName =
        document.getElementById(
            "accountStudentName"
        );

    const studentNumber =
        document.getElementById(
            "accountStudentNumber"
        );

    const studentEmail =
        document.getElementById(
            "accountStudentEmail"
        );

    const studentCampus =
        document.getElementById(
            "accountStudentCampus"
        );

    const studentProgram =
        document.getElementById(
            "accountStudentProgram"
        );

    const profileStatus =
        document.getElementById(
            "accountProfileStatus"
        );

    if (!student) {
        if (badge) badge.textContent = "GS";
        if (studentName) studentName.textContent = "Guest Student";
        if (studentNumber) studentNumber.textContent = "Not connected";
        if (studentEmail) studentEmail.textContent = "Not connected";
        if (studentCampus) studentCampus.textContent = "Not connected";
        if (studentProgram) studentProgram.textContent = "Not connected";
        if (profileStatus) profileStatus.textContent = "Not connected";
        return;
    }

    const name =
        student.full_name ||
        student.name ||
        "Student";

    const initials =
        name
            .split(/\s+/)
            .map(part => part[0])
            .slice(0, 2)
            .join("")
            .toUpperCase() ||
        "ST";

    if (badge) {
        badge.textContent = initials;
    }

    if (studentName) {
        studentName.textContent = name;
    }

    if (studentNumber) {
        studentNumber.textContent =
            student.student_number ||
            "Not provided";
    }

    if (studentEmail) {
        studentEmail.textContent =
            student.email ||
            "Not provided";
    }

    if (studentCampus) {
        studentCampus.textContent =
            student.campus_name ||
            student.campus ||
            "Not provided";
    }

    if (studentProgram) {
        studentProgram.textContent =
            student.program_name ||
            student.program ||
            "Not provided";
    }

    if (profileStatus) {
        profileStatus.textContent =
            "Connected";
    }
}

// ============================================================
// CREATE STORE ORDER
// ============================================================

async function createStoreOrder() {
    const message =
        document.getElementById(
            "checkoutMessage"
        );

    if (!message) {
        return;
    }

    if (!cart.length) {
        message.textContent =
            "Your cart is empty.";
        return;
    }

    if (!requireAuthentication()) {
        return;
    }

    const checkoutButton =
        document.getElementById(
            "checkoutBtn"
        );

    if (checkoutButton) {
        checkoutButton.disabled = true;
    }

    message.textContent =
        "Creating your order...";

    try {
        const items =
            cart.map(item => ({
                product_id: Number(item.id),
                quantity: Number(item.quantity)
            }));

        const data =
            await apiRequest(
                "/store/orders",
                {
                    method: "POST",
                    body: JSON.stringify({
                        items
                    })
                }
            );

        const order =
            data.order ||
            data.data;

        if (!order) {
            throw new Error(
                "The server did not return an order."
            );
        }

        message.textContent =
            `Order #${order.order_id} created. Preparing payment...`;

        await payStoreOrder(
            order.order_id
        );

    } catch (error) {
        console.error(
            "Store order failed:",
            error
        );

        message.textContent =
            `Order failed: ${error.message}`;

    } finally {
        if (checkoutButton) {
            checkoutButton.disabled = false;
        }
    }
}

// ============================================================
// PAY STORE ORDER
// ============================================================

async function payStoreOrder(orderId) {
    const message =
        document.getElementById(
            "checkoutMessage"
        );

    try {
        const data =
            await apiRequest(
                `/store/orders/${orderId}/pay`,
                {
                    method: "POST"
                }
            );

        const payment =
            data.payment ||
            data.data ||
            {};

        const amount =
            Number(
                payment.amount_paid ??
                payment.amount ??
                0
            );

        const balanceAfter =
            Number(
                payment.balance_after ??
                0
            );

        clearCart();

        message.textContent =
            `Purchase successful. R${amount.toFixed(2)} was deducted. ` +
            `Remaining balance: R${balanceAfter.toFixed(2)}.`;

        await Promise.all([
            loadWallet(),
            loadTransactions(),
            loadStoreOrders()
        ]);

    } catch (error) {
        console.error(
            "Store payment failed:",
            error
        );

        /*
         * IMPORTANT:
         * The order has already been created.
         * We do NOT clear the cart if payment fails.
         */
        message.textContent =
            `Order created, but payment failed: ${error.message}`;
    }
}

// ============================================================
// STORE ORDER HISTORY
// ============================================================

async function loadStoreOrders() {
    const tbody =
        document.getElementById(
            "storeOrderHistoryBody"
        );

    if (!tbody) {
        return;
    }

    try {
        const data =
            await apiRequest(
                "/store/orders"
            );

        currentStoreOrders =
            Array.isArray(data.orders)
                ? data.orders
                : Array.isArray(data.data)
                    ? data.data
                    : [];

        renderStoreOrderHistory();

    } catch (error) {
        console.error(
            "Failed to load Store orders:",
            error
        );

        tbody.innerHTML =
            `<tr>
                <td colspan="8" style="padding:20px;color:#b91c1c;text-align:center;">
                    Unable to load order history.
                </td>
            </tr>`;
    }
}

function normalizeOrderStatus(status) {
    const value =
        String(status || "").toLowerCase();

    switch (value) {
        case "pending":
            return "Processing";

        case "confirmed":
            return "Processing";

        case "processing":
            return "Processing";

        case "packed":
            return "Packed";

        case "in_transit":
        case "in transit":
            return "In transit";

        case "delivered":
            return "Delivered";

        case "completed":
            return "Delivered";

        case "cancelled":
        case "canceled":
            return "Cancelled";

        default:
            return status || "Processing";
    }
}

function getOrderReference(order) {
    return String(
        order.reference ??
        order.order_reference ??
        order.order_number ??
        `ST-${order.order_id}`
    );
}

function getOrderDate(order) {
    return (
        order.created_at ??
        order.order_date ??
        order.date ??
        ""
    );
}

function getOrderTotal(order) {
    return Number(
        order.total_amount ??
        order.total ??
        0
    );
}

function getOrderQuantity(order) {
    if (Array.isArray(order.items)) {
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

function renderStoreOrderHistory() {
    const tbody =
        document.getElementById(
            "storeOrderHistoryBody"
        );

    if (!tbody) {
        return;
    }

    const fromDate =
        document.getElementById(
            "storeOrderFromDate"
        )?.value || "";

    const toDate =
        document.getElementById(
            "storeOrderToDate"
        )?.value || "";

    const statusFilter =
        document.getElementById(
            "storeOrderStatus"
        )?.value || "all";

    const referenceFilter =
        (
            document.getElementById(
                "storeOrderReference"
            )?.value || ""
        )
            .trim()
            .toLowerCase();

    const rows =
        currentStoreOrders.filter(order => {
            const date =
                getOrderDate(order)
                    .slice(0, 10);

            const displayStatus =
                normalizeOrderStatus(
                    order.status
                );

            const matchesFrom =
                !fromDate ||
                date >= fromDate;

            const matchesTo =
                !toDate ||
                date <= toDate;

            const matchesStatus =
                statusFilter === "all" ||
                displayStatus === statusFilter ||
                String(order.status).toLowerCase() ===
                    String(statusFilter).toLowerCase();

            const reference =
                getOrderReference(order)
                    .toLowerCase();

            const matchesReference =
                !referenceFilter ||
                reference.includes(
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
                <td colspan="8" style="padding:20px;color:#64748b;text-align:center;">
                    No matching orders found.
                </td>
            </tr>`;

        return;
    }

    tbody.innerHTML =
        rows.map(order => {
            const orderId =
                order.order_id ??
                order.id;

            const orderDate =
                getOrderDate(order)
                    .slice(0, 10);

            const deliveryDate =
                order.delivery_date ??
                order.deliveryDate ??
                "—";

            const total =
                getOrderTotal(order);

            const quantity =
                getOrderQuantity(order);

            const status =
                normalizeOrderStatus(
                    order.status
                );

            const reference =
                getOrderReference(order);

            return `
                <tr>
                    <td>${escapeHtml(String(orderId))}</td>
                    <td>${escapeHtml(orderDate)}</td>
                    <td>${escapeHtml(String(deliveryDate))}</td>
                    <td>R${total.toFixed(2)}</td>
                    <td>${quantity}</td>
                    <td>${escapeHtml(orderDate)}</td>
                    <td>
                        <button
                            type="button"
                            class="view-btn"
                            data-order-id="${escapeHtml(String(orderId))}">
                            View
                        </button>
                    </td>
                    <td>
                        <button
                            type="button"
                            class="reorder-btn"
                            data-order-id="${escapeHtml(String(orderId))}">
                            Re-order
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

    tbody
        .querySelectorAll(".view-btn")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => viewStoreOrder(
                    button.dataset.orderId
                )
            );
        });

    tbody
        .querySelectorAll(".reorder-btn")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => reorderStoreOrder(
                    button.dataset.orderId
                )
            );
        });
}

// ============================================================
// VIEW ORDER
// ============================================================

async function viewStoreOrder(orderId) {
    try {
        const data =
            await apiRequest(
                `/store/orders/${orderId}`
            );

        const order =
            data.order ||
            data.data;

        if (!order) {
            throw new Error(
                "Order details unavailable."
            );
        }

        const items =
            Array.isArray(order.items)
                ? order.items
                : [];

        const itemText =
            items.length
                ? items.map(item => {
                    const name =
                        item.product_name ??
                        item.name ??
                        `Product #${item.product_id}`;

                    return `${name} × ${item.quantity}`;
                }).join(", ")
                : "No item details available";

        alert(
            `Order #${order.order_id}\n` +
            `Status: ${normalizeOrderStatus(order.status)}\n` +
            `Reference: ${getOrderReference(order)}\n` +
            `Total: R${getOrderTotal(order).toFixed(2)}\n` +
            `Items: ${itemText}`
        );

    } catch (error) {
        console.error(
            "Unable to load order details:",
            error
        );

        alert(
            `Unable to load order details: ${error.message}`
        );
    }
}

// ============================================================
// RE-ORDER
// ============================================================

async function reorderStoreOrder(orderId) {
    try {
        const data =
            await apiRequest(
                `/store/orders/${orderId}`
            );

        const order =
            data.order ||
            data.data;

        if (!order || !Array.isArray(order.items)) {
            throw new Error(
                "Order items could not be loaded."
            );
        }

        let addedCount = 0;

        for (const item of order.items) {
            const productId =
                Number(
                    item.product_id ??
                    item.id
                );

            const product =
                currentProducts.find(
                    currentProduct =>
                        Number(currentProduct.id) ===
                        productId
                );

            if (!product) {
                continue;
            }

            const existing =
                cart.find(
                    cartItem =>
                        Number(cartItem.id) ===
                        productId
                );

            const quantity =
                Number(item.quantity || 1);

            if (existing) {
                existing.quantity += quantity;
            } else {
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity,
                    image: product.image
                });
            }

            addedCount += quantity;
        }

        saveCart();
        renderCart();

        if (addedCount > 0) {
            showGlobalMessage(
                `${addedCount} item(s) added back to your cart.`
            );
        } else {
            showGlobalMessage(
                "None of the previous order's products are currently available.",
                true
            );
        }

    } catch (error) {
        console.error(
            "Re-order failed:",
            error
        );

        showGlobalMessage(
            `Unable to re-order: ${error.message}`,
            true
        );
    }
}

// ============================================================
// HTML ESCAPING
// ============================================================

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// ============================================================
// 360° HOODIE DEMO
// ============================================================

function setupDemoViewer() {
    const demoViewer =
        document.getElementById(
            "demoViewer"
        );

    const demoRotateBtn =
        document.querySelector(
            ".demo-rotate-btn"
        );

    if (!demoViewer) {
        return;
    }

    const rotationAngles =
        [0, 35, 75, 120, 165, 220, 275, 330];

    let demoIndex = 0;

    function applyDemoRotation(index) {
        const image =
            demoViewer.querySelector(
                ".demo-image"
            );

        if (!image) {
            return;
        }

        const angle =
            rotationAngles[
                index % rotationAngles.length
            ];

        image.style.transform =
            `perspective(1200px) ` +
            `rotateY(${angle}deg) ` +
            `rotateX(7deg) ` +
            `scale(1.04)`;

        demoViewer.classList.add(
            "is-rotating"
        );

        clearTimeout(
            demoViewer.demoTimer
        );

        demoViewer.demoTimer =
            setTimeout(() => {
                demoViewer.classList.remove(
                    "is-rotating"
                );
            }, 700);
    }

    function cycleDemoRotation() {
        demoIndex += 1;
        applyDemoRotation(demoIndex);
    }

    demoViewer.addEventListener(
        "click",
        cycleDemoRotation
    );

    if (demoRotateBtn) {
        demoRotateBtn.addEventListener(
            "click",
            cycleDemoRotation
        );
    }

    applyDemoRotation(demoIndex);
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {
    const addFundsButton =
        document.getElementById(
            "addFundsBtn"
        );

    if (addFundsButton) {
        addFundsButton.addEventListener(
            "click",
            topUpWallet
        );
    }

    const checkoutButton =
        document.getElementById(
            "checkoutBtn"
        );

    if (checkoutButton) {
        checkoutButton.addEventListener(
            "click",
            createStoreOrder
        );
    }

    const searchButton =
        document.getElementById(
            "storeOrderSearchBtn"
        );

    if (searchButton) {
        searchButton.addEventListener(
            "click",
            renderStoreOrderHistory
        );
    }

    const clearButton =
        document.getElementById(
            "storeOrderClearBtn"
        );

    if (clearButton) {
        clearButton.addEventListener(
            "click",
            () => {
                const fromDate =
                    document.getElementById(
                        "storeOrderFromDate"
                    );

                const toDate =
                    document.getElementById(
                        "storeOrderToDate"
                    );

                const status =
                    document.getElementById(
                        "storeOrderStatus"
                    );

                const reference =
                    document.getElementById(
                        "storeOrderReference"
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

                renderStoreOrderHistory();
            }
        );
    }
}

// ============================================================
// INITIALIZATION
// ============================================================

async function initializeStore() {
    console.log("RI Store initializing...");

    if (!requireAuthentication()) {
        renderCart();
        setupDemoViewer();
        setupEventListeners();
        return;
    }

    setupDemoViewer();
    setupEventListeners();
    renderCart();

    /*
     * Load all real backend data.
     * Promise.allSettled allows one failed request
     * without taking down the entire Store page.
     */
    await Promise.allSettled([
        loadProducts(),
        loadCategories(),
        loadWallet(),
        loadTransactions(),
        loadStudentProfile(),
        loadStoreOrders()
    ]);

    console.log("RI Store initialized.");
}

document.addEventListener(
    "DOMContentLoaded",
    initializeStore
);
