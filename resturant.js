// ─── Menu Items ───────────────────────────────────────────
const restaurantProducts = [
    {
        id: 1,
        name: "Cheeseburger",
        price: 65,
        image: "cheesebugger.jpeg",
        description: "Juicy beef patty with melted cheese and fresh toppings."
    },
    {
        id: 2,
        name: "Fast Food Combo",
        price: 80,
        image: "fastfood.jpeg",
        description: "Burger, fries and a cold drink — the full deal."
    },
    {
        id: 3,
        name: "Coffee",
        price: 35,
        image: "Coffe.jpeg",
        description: "Freshly brewed hot coffee to keep you going."
    },
    {
        id: 4,
        name: "Cool Drinks",
        price: 25,
        image: "Energy-drinks.jpeg",
        description: "Chilled energy drinks and sodas."
    }
];

// ─── Wallet Setup ─────────────────────────────────────────
const restaurantWalletKey = "restaurantWallet";

const savedRestaurantWallet =
    localStorage.getItem(restaurantWalletKey);

const restaurantWallet = savedRestaurantWallet
    ? JSON.parse(savedRestaurantWallet)
    : {
        balance: 1000,
        transactions: []
    };

// ─── Cart Setup ───────────────────────────────────────────
const restaurantCartKey = "restaurantCart";

const savedRestaurantCart =
    localStorage.getItem(restaurantCartKey);

const restaurantCart = savedRestaurantCart
    ? JSON.parse(savedRestaurantCart)
    : [];

// ─── Wallet Functions ─────────────────────────────────────
function saveRestaurantWallet() {
    localStorage.setItem(
        restaurantWalletKey,
        JSON.stringify(restaurantWallet)
    );
}

function updateRestaurantWalletDisplay() {
    const balanceElement =
        document.getElementById("restaurantWalletBalance");

    if (!balanceElement) {
        return;
    }

    balanceElement.textContent =
        `R${restaurantWallet.balance.toFixed(2)}`;
}

function addRestaurantFunds(amount) {
    if (amount <= 0) {
        return false;
    }

    restaurantWallet.balance += amount;

    restaurantWallet.transactions.push({
        type: "top-up",
        amount: amount,
        date: new Date().toISOString()
    });

    saveRestaurantWallet();
    updateRestaurantWalletDisplay();
    renderRestaurantTransactionHistory();

    return true;
}

// ─── Cart Functions ───────────────────────────────────────
function saveRestaurantCart() {
    localStorage.setItem(
        restaurantCartKey,
        JSON.stringify(restaurantCart)
    );
}

function addToRestaurantCart(productId) {
    const product = restaurantProducts.find(
        item => item.id === productId
    );

    if (!product) {
        return;
    }

    const existingItem = restaurantCart.find(
        item => item.id === productId
    );

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        restaurantCart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    saveRestaurantCart();
    renderRestaurantCart();
}

function removeFromRestaurantCart(productId) {
    const index = restaurantCart.findIndex(
        item => item.id === productId
    );

    if (index === -1) {
        return;
    }

    restaurantCart.splice(index, 1);

    saveRestaurantCart();
    renderRestaurantCart();
}

function calculateRestaurantCartTotal() {
    return restaurantCart.reduce(
        (total, item) => total + (item.price * item.quantity),
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
        cartContainer.innerHTML = "<p>Your cart is empty.</p>";
        totalElement.textContent = "R0.00";
        return;
    }

    cartContainer.replaceChildren();

    restaurantCart.forEach(item => {
        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";

        const itemName = document.createElement("span");
        itemName.textContent = `${item.name} × ${item.quantity}`;

        const itemPrice = document.createElement("span");
        itemPrice.textContent =
            `R${(item.price * item.quantity).toFixed(2)}`;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Remove";
        removeButton.addEventListener(
            "click",
            () => removeFromRestaurantCart(item.id)
        );

        cartItem.append(itemName, itemPrice, removeButton);
        cartContainer.appendChild(cartItem);
    });

    totalElement.textContent =
        `R${calculateRestaurantCartTotal().toFixed(2)}`;
}

function restaurantCheckout() {
    const checkoutMessage =
        document.getElementById("restaurantCheckoutMessage");

    if (restaurantCart.length === 0) {
        if (checkoutMessage) {
            checkoutMessage.textContent = "Your cart is empty.";
        }
        return;
    }

    const total = calculateRestaurantCartTotal();

    if (restaurantWallet.balance < total) {
        if (checkoutMessage) {
            checkoutMessage.textContent =
                "Insufficient wallet balance. Please add funds.";
        }
        return;
    }

    restaurantWallet.balance -= total;

    restaurantWallet.transactions.push({
        type: "purchase",
        amount: total,
        items: restaurantCart.map(item => ({
            name: item.name,
            quantity: item.quantity
        })),
        date: new Date().toISOString()
    });

    restaurantCart.length = 0;

    saveRestaurantWallet();
    saveRestaurantCart();
    updateRestaurantWalletDisplay();
    renderRestaurantCart();
    renderRestaurantTransactionHistory();

    if (checkoutMessage) {
        checkoutMessage.textContent =
            `Order placed! R${total.toFixed(2)} deducted from your wallet.`;
    }

    // ✅ Trigger order status
    showOrderStatus();
}

function showOrderStatus() {
    const section = document.getElementById("orderStatusSection");
    const statusPlaced = document.getElementById("statusPlaced");
    const statusPreparing = document.getElementById("statusPreparing");
    const statusReady = document.getElementById("statusReady");
    const statusMessage = document.getElementById("orderStatusMessage");
    const dividers = document.querySelectorAll(".status-divider");

    if (!section) return;

    // Show the section and scroll to it
    section.style.display = "block";
    section.scrollIntoView({ behavior: "smooth", block: "center" });

    // Step 1 — Order Placed (immediately)
    statusPlaced.classList.add("active");
    statusMessage.textContent = "Your order has been received!";

    // Step 2 — Preparing (after 2 seconds)
    setTimeout(() => {
        statusPreparing.classList.remove("dimmed");
        statusPreparing.classList.add("active");
        dividers[0].classList.add("filled");
        statusMessage.textContent = "The kitchen is preparing your order...";
    }, 2000);

    // Step 3 — Ready (after 30 seconds)
    setTimeout(() => {
        statusReady.classList.remove("dimmed");
        statusReady.classList.add("active");
        dividers[1].classList.add("filled");
        statusMessage.textContent = "🎉 Your order is ready for collection!";
    }, 30000);
}

// ─── Menu Render ──────────────────────────────────────────
function createMenuCard(product) {
    const card = document.createElement("article");
    card.className = "restaurant-card";

    const imageDiv = document.createElement("div");
    imageDiv.className = "rest-img";

    const img = document.createElement("img");
    img.src = product.image;
    img.alt = product.name;
    img.className = "rest-card-img";
    img.loading = "lazy";
    imageDiv.appendChild(img);

    const info = document.createElement("div");
    info.className = "rest-info";

    const name = document.createElement("h3");
    name.textContent = product.name;

    const description = document.createElement("p");
    description.className = "cuisine";
    description.textContent = product.description;

    const price = document.createElement("p");
    price.className = "price";
    price.textContent = `R${product.price.toFixed(2)}`;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn-menu";
    button.textContent = "Add to Order";
    button.addEventListener(
        "click",
        () => addToRestaurantCart(product.id)
    );

    info.append(name, description, price, button);
    card.append(imageDiv, info);

    return card;
}

function renderRestaurantMenu() {
    const grid = document.getElementById("restaurantMenuGrid");

    if (!grid) {
        return;
    }

    const fragment = document.createDocumentFragment();

    restaurantProducts.forEach(product => {
        fragment.appendChild(createMenuCard(product));
    });

    grid.replaceChildren(fragment);
}

// ─── Transaction History ──────────────────────────────────
function renderRestaurantTransactionHistory() {
    const historyContainer =
        document.getElementById("restaurantTransactionHistory");

    if (!historyContainer) {
        return;
    }

    if (restaurantWallet.transactions.length === 0) {
        historyContainer.innerHTML = "<p>No transactions yet.</p>";
        return;
    }

    historyContainer.replaceChildren();

    const transactions =
        [...restaurantWallet.transactions].reverse();

    transactions.forEach(transaction => {
        const transactionItem = document.createElement("article");
        transactionItem.className = "transaction-item";

        const transactionInfo = document.createElement("div");
        transactionInfo.className = "transaction-info";

        const transactionType = document.createElement("strong");
        transactionType.textContent =
            transaction.type === "top-up"
                ? "Wallet Top-up"
                : "Food Order";

        const transactionDate = document.createElement("small");
        transactionDate.textContent =
            new Date(transaction.date).toLocaleString();

        transactionInfo.append(transactionType, transactionDate);

        const transactionAmount = document.createElement("strong");
        const isCredit = transaction.type === "top-up";
        transactionAmount.textContent =
            `${isCredit ? "+" : "-"}R${transaction.amount.toFixed(2)}`;
        transactionAmount.className =
            isCredit ? "transaction-credit" : "transaction-debit";

        transactionItem.append(transactionInfo, transactionAmount);
        historyContainer.appendChild(transactionItem);
    });
}

// ─── Event Listeners ──────────────────────────────────────
const restaurantAddFundsButton =
    document.getElementById("restaurantAddFundsBtn");

const restaurantTopupInput =
    document.getElementById("restaurantTopupAmount");

const restaurantWalletMessage =
    document.getElementById("restaurantWalletMessage");

if (restaurantAddFundsButton) {
    restaurantAddFundsButton.addEventListener("click", () => {
        const amount = Number(restaurantTopupInput?.value);

        if (!Number.isFinite(amount) || amount <= 0) {
            if (restaurantWalletMessage) {
                restaurantWalletMessage.textContent =
                    "Please enter a valid amount.";
            }
            return;
        }

        addRestaurantFunds(amount);

        if (restaurantWalletMessage) {
            restaurantWalletMessage.textContent =
                `R${amount.toFixed(2)} added successfully.`;
        }

        if (restaurantTopupInput) {
            restaurantTopupInput.value = "";
        }
    });
}

const restaurantCheckoutBtn =
    document.getElementById("restaurantCheckoutBtn");

if (restaurantCheckoutBtn) {
    restaurantCheckoutBtn.addEventListener(
        "click",
        restaurantCheckout
    );
}

// ─── Startup ──────────────────────────────────────────────
renderRestaurantMenu();
renderRestaurantCart();
updateRestaurantWalletDisplay();
renderRestaurantTransactionHistory();