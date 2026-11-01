
const API_URL = "https://fakestoreapi.com/products";

const productGrid = document.getElementById("productGrid");
const productMessage = document.getElementById("productMessage");
const searchInput = document.getElementById("searchInput");

const cartButton = document.getElementById("cartButton");
const cartPanel = document.getElementById("cartPanel");
const cartOverlay = document.getElementById("cartOverlay");
const closeCart = document.getElementById("closeCart");
const cartItems = document.getElementById("cartItems");

const checkoutButton = document.getElementById("checkoutButton");
const checkoutModal = document.getElementById("checkoutModal");
const closeModal = document.getElementById("closeModal");
const continueShopping = document.getElementById("continueShopping");

let products = [];
let cart = JSON.parse(localStorage.getItem("shopEaseCart")) || [];
let selectedCategory = "all";

const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
});

// Load products from FakeStoreAPI
async function loadProducts() {
    productMessage.textContent = "Loading products...";

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to load products.");
        }

        products = await response.json();

        productMessage.textContent = "";
        displayProducts();
        updateCart();

    } catch (error) {
        productMessage.textContent =
            "Unable to load products. Please check your internet connection and try again.";
        console.error(error);
    }
}

// Display products
function displayProducts() {
    productGrid.innerHTML = "";

    const searchText = searchInput.value.toLowerCase().trim();

    const filteredProducts = products.filter(product => {
        const matchesCategory =
            selectedCategory === "all" ||
            product.category === selectedCategory;

        const matchesSearch =
            product.title.toLowerCase().includes(searchText);

        return matchesCategory && matchesSearch;
    });

    if (filteredProducts.length === 0) {
        productMessage.textContent = "No products found.";
        return;
    }

    productMessage.textContent =
        `Showing ${filteredProducts.length} products`;

    filteredProducts.forEach(product => {
        const card = document.createElement("article");
        card.className = "product-card";

        const imageArea = document.createElement("div");
        imageArea.className = "product-image";

        const image = document.createElement("img");
        image.src = product.image;
        image.alt = product.title;
        image.loading = "lazy";

        imageArea.appendChild(image);

        const info = document.createElement("div");
        info.className = "product-info";

        const category = document.createElement("p");
        category.className = "product-category";
        category.textContent = product.category;

        const title = document.createElement("h3");
        title.className = "product-title";
        title.textContent = product.title;

        const rating = document.createElement("p");
        rating.className = "product-rating";
        rating.textContent =
            `★ ${product.rating.rate} (${product.rating.count} reviews)`;

        const bottom = document.createElement("div");
        bottom.className = "product-bottom";

        const price = document.createElement("span");
        price.className = "product-price";
        price.textContent = currency.format(product.price);

        const addButton = document.createElement("button");
        addButton.className = "add-cart-btn";
        addButton.textContent = "Add to Cart";

        addButton.addEventListener("click", () => {
            addToCart(product.id);
        });

        bottom.appendChild(price);
        bottom.appendChild(addButton);

        info.appendChild(category);
        info.appendChild(title);
        info.appendChild(rating);
        info.appendChild(bottom);

        card.appendChild(imageArea);
        card.appendChild(info);

        productGrid.appendChild(card);
    });
}

// Search products
searchInput.addEventListener("input", displayProducts);

// Category filters
document.querySelectorAll(".category-btn").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".category-btn").forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");
        selectedCategory = button.dataset.category;

        displayProducts();
    });
});

// Save cart in localStorage
function saveCart() {
    localStorage.setItem("shopEaseCart", JSON.stringify(cart));
}

// Add products to cart
function addToCart(productId) {
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: productId,
            quantity: 1
        });
    }

    saveCart();
    updateCart();
}

// Increase or decrease quantity
function changeQuantity(productId, amount) {
    const item = cart.find(item => item.id === productId);

    if (!item) return;

    item.quantity += amount;

    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }

    saveCart();
    updateCart();
}

// Remove product from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);

    saveCart();
    updateCart();
}

// Update shopping cart
function updateCart() {
    cartItems.innerHTML = "";

    let subtotal = 0;
    let itemCount = 0;

    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);

        if (!product) return;

        subtotal += product.price * item.quantity;
        itemCount += item.quantity;

        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";

        const image = document.createElement("img");
        image.src = product.image;
        image.alt = product.title;

        const info = document.createElement("div");
        info.className = "cart-item-info";

        const title = document.createElement("h4");
        title.textContent = product.title;

        const price = document.createElement("p");
        price.textContent =
            currency.format(product.price * item.quantity);

        const controls = document.createElement("div");
        controls.className = "quantity-controls";

        const minus = document.createElement("button");
        minus.textContent = "−";
        minus.setAttribute("aria-label", "Decrease quantity");
        minus.addEventListener("click", () => {
            changeQuantity(item.id, -1);
        });

        const quantity = document.createElement("span");
        quantity.textContent = item.quantity;

        const plus = document.createElement("button");
        plus.textContent = "+";
        plus.setAttribute("aria-label", "Increase quantity");
        plus.addEventListener("click", () => {
            changeQuantity(item.id, 1);
        });

        controls.appendChild(minus);
        controls.appendChild(quantity);
        controls.appendChild(plus);

        const remove = document.createElement("button");
        remove.className = "remove-btn";
        remove.textContent = "Remove";
        remove.addEventListener("click", () => {
            removeFromCart(item.id);
        });

        info.appendChild(title);
        info.appendChild(price);
        info.appendChild(controls);
        info.appendChild(remove);

        cartItem.appendChild(image);
        cartItem.appendChild(info);

        cartItems.appendChild(cartItem);
    });

    document.getElementById("cartCount").textContent = itemCount;

    if (itemCount === 0) {
        cartItems.textContent = "Your cart is empty. Start shopping!";
    }

    const tax = subtotal * 0.05;
    const shipping = subtotal === 0 ? 0 : subtotal >= 100 ? 0 : 5;
    const total = subtotal + tax + shipping;

    document.getElementById("subtotal").textContent =
        currency.format(subtotal);

    document.getElementById("tax").textContent =
        currency.format(tax);

    document.getElementById("shipping").textContent =
        shipping === 0 && subtotal > 0
            ? "FREE"
            : currency.format(shipping);

    document.getElementById("total").textContent =
        currency.format(total);
}

// Open cart
function openCart() {
    cartPanel.classList.add("open");
    cartOverlay.classList.add("show");
}

function hideCart() {
    cartPanel.classList.remove("open");
    cartOverlay.classList.remove("show");
}

cartButton.addEventListener("click", openCart);
closeCart.addEventListener("click", hideCart);
cartOverlay.addEventListener("click", hideCart);

// Checkout
checkoutButton.addEventListener("click", () => {
    if (cart.length === 0) {
        alert("Your cart is empty. Add some products first!");
        return;
    }

    hideCart();

    checkoutModal.classList.add("show");

    cart = [];
    saveCart();
    updateCart();
});

// Close checkout modal
function hideModal() {
    checkoutModal.classList.remove("show");
}

closeModal.addEventListener("click", hideModal);
continueShopping.addEventListener("click", hideModal);

// Close cart or modal using Escape key
document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        hideCart();
        hideModal();
    }
});

// Start the application
loadProducts();
