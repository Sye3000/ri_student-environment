const walletKey = "storeWallet";

const savedWallet = localStorage.getItem(walletKey);

const wallet = savedWallet
    ? JSON.parse(savedWallet)
    : {
        balance: 1000,
        transactions: []
    };
    function saveWallet() {
    localStorage.setItem(
        walletKey,
        JSON.stringify(wallet)
    );
}

function updateWalletDisplay() {
    const balanceElement = document.getElementById("walletBalance");

    if (!balanceElement) {
        return;
    }

    balanceElement.textContent = `R${wallet.balance.toFixed(2)}`;
}

function addFunds(amount) {
    if (amount <= 0) {
        return false;
    }

    wallet.balance += amount;

    wallet.transactions.push({
        type: "top-up",
        amount: amount,
        date: new Date().toISOString()
    });

    saveWallet();
updateWalletDisplay();
return true;
}
const cartKey = "storeCart";

const savedCart = localStorage.getItem(cartKey);

const cart = savedCart
    ? JSON.parse(savedCart)
    : [];
const products = [
    { id: 1, name: "University Hoodie", price: 480, cat: "clothing", image: "Hoodies.jpeg" }
];

const grid = document.getElementById("productGrid");
const buttons = document.querySelectorAll(".category-btn");

function createProductCard(product) {
    const card = document.createElement("article");
    card.className = "product-card";
    card.dataset.category = product.cat;

    const image = document.createElement("div");
    image.className = "product-image";
    image.setAttribute("aria-hidden", "true");
    
    const img = document.createElement("img");
    img.src = product.image;
    img.alt = product.name;
    img.className = "product-img";
    image.appendChild(img);

    const name = document.createElement("h3");
    name.textContent = product.name;

    const description = document.createElement("p");
    description.textContent = "Premium campus hoodie - Represent your university in style.";

    const price = document.createElement("p");
    price.className = "price";
    price.textContent = `R${product.price}`;

    const button = document.createElement("button");

button.type = "button";
button.className = "btn-menu";
button.textContent = "Add to Cart";

button.addEventListener(
    "click",
    () => addToCart(product.id)
);
card.append(
    image,
    name,
    description,
    price,
    button
);

return card;
}

function render(category = "all") {
    if (!grid) {
        return;
    }

    const filteredProducts = category === "all"
        ? products
        : products.filter(product => product.cat === category);

    const fragment = document.createDocumentFragment();

    filteredProducts.forEach(product => {
        fragment.appendChild(createProductCard(product));
    });

    grid.replaceChildren(fragment);
}

buttons.forEach(button => {
    button.addEventListener("click", () => {
        buttons.forEach(categoryButton => {
            const isSelected = categoryButton === button;
            categoryButton.classList.toggle("active", isSelected);
            categoryButton.setAttribute("aria-pressed", String(isSelected));
        });

        render(button.dataset.cat);
    });
});

render();
const addFundsButton = document.getElementById("addFundsBtn");
const topupInput = document.getElementById("topupAmount");
const walletMessage = document.getElementById("walletMessage");

if (addFundsButton) {
    addFundsButton.addEventListener("click", () => {

        const amount = Number(topupInput.value);

        if (!Number.isFinite(amount) || amount <= 0) {
            walletMessage.textContent =
                "Please enter a valid amount.";

            return;
        }

        addFunds(amount);

        walletMessage.textContent =
    `R${amount.toFixed(2)} added successfully.`;
        topupInput.value = "";
    });
}

updateWalletDisplay();
function saveCart() {
    localStorage.setItem(
        cartKey,
        JSON.stringify(cart)
    );
}

function addToCart(productId) {
    const product = products.find(
        item => item.id === productId
    );

    if (!product) {
        return;
    }

    const existingItem = cart.find(
        item => item.id === productId
    );

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    saveCart();
    renderCart();
}

function removeFromCart(productId) {
    const index = cart.findIndex(
        item => item.id === productId
    );

    if (index === -1) {
        return;
    }

    cart.splice(index, 1);

    saveCart();
    renderCart();
}

function calculateCartTotal() {
    return cart.reduce(
        (total, item) =>
            total + (item.price * item.quantity),
        0
    );
}
function renderCart() {

    const cartContainer =
        document.getElementById("cartItems");

    const totalElement =
        document.getElementById("cartTotal");

    if (!cartContainer || !totalElement) {
        return;
    }

    if (cart.length === 0) {

        cartContainer.innerHTML =
            "<p>Your cart is empty.</p>";

        totalElement.textContent = "R0.00";

        return;
    }

    cartContainer.replaceChildren();

    cart.forEach(item => {

        const cartItem =
            document.createElement("div");

        cartItem.className = "cart-item";

        const itemName =
            document.createElement("span");

        itemName.textContent =
            `${item.name} × ${item.quantity}`;

        const itemPrice =
            document.createElement("span");

        itemPrice.textContent =
            `R${(item.price * item.quantity).toFixed(2)}`;

        const removeButton =
            document.createElement("button");

        removeButton.type = "button";
        removeButton.textContent = "Remove";

        removeButton.addEventListener(
            "click",
            () => removeFromCart(item.id)
        );

        cartItem.append(
            itemName,
            itemPrice,
            removeButton
        );

        cartContainer.appendChild(cartItem);
    });

    totalElement.textContent =
        `R${calculateCartTotal().toFixed(2)}`;
}
function checkout() {

    const checkoutMessage =
        document.getElementById("checkoutMessage");

    if (cart.length === 0) {

        checkoutMessage.textContent =
            "Your cart is empty.";

        return;
    }

    const total = calculateCartTotal();

    if (wallet.balance < total) {

        checkoutMessage.textContent =
            "Insufficient wallet balance.";

        return;
    }

    wallet.balance -= total;

    wallet.transactions.push({
        type: "purchase",
        amount: total,
        items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity
        })),
        date: new Date().toISOString()
    });

    cart.length = 0;

    saveWallet();
    saveCart();

    updateWalletDisplay();
    renderCart();

    checkoutMessage.textContent =
        `Purchase successful. R${total.toFixed(2)} was deducted from your wallet.`;
}

function renderTransactionHistory() {

    const historyContainer =
        document.getElementById("transactionHistory");

    if (!historyContainer) {
        return;
    }

    if (wallet.transactions.length === 0) {

        historyContainer.innerHTML =
            "<p>No transactions yet.</p>";

        return;
    }

    historyContainer.replaceChildren();

    const transactions =
        [...wallet.transactions].reverse();

    transactions.forEach(transaction => {

        const transactionItem =
            document.createElement("article");

        transactionItem.className =
            "transaction-item";

        const transactionInfo =
            document.createElement("div");

        transactionInfo.className =
            "transaction-info";

        const transactionType =
            document.createElement("strong");

        if (transaction.type === "top-up") {

            transactionType.textContent =
                "Wallet Top-up";

        } else if (transaction.type === "purchase") {

            transactionType.textContent =
                "Store Purchase";

        } else {

            transactionType.textContent =
                "Transaction";
        }

        const transactionDate =
            document.createElement("small");

        const date =
            new Date(transaction.date);

        transactionDate.textContent =
            date.toLocaleString();

        transactionInfo.append(
            transactionType,
            transactionDate
        );

        const transactionAmount =
            document.createElement("strong");

        const isCredit =
            transaction.type === "top-up";

        transactionAmount.textContent =
            `${isCredit ? "+" : "-"}R${transaction.amount.toFixed(2)}`;

        transactionAmount.className =
            isCredit
                ? "transaction-credit"
                : "transaction-debit";

        transactionItem.append(
            transactionInfo,
            transactionAmount
        );

        historyContainer.appendChild(
            transactionItem
        );
    });
}

render();
renderCart();
updateWalletDisplay();
renderTransactionHistory();


const checkoutButton =
    document.getElementById("checkoutBtn");

if (checkoutButton) {

    checkoutButton.addEventListener(
        "click",
        checkout
    );
}