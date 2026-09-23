const API_URL = "https://product-inventor-website.onrender.com/api/products";

const productForm =
    document.getElementById("productForm");

const productName =
    document.getElementById("productName");

const productBalance =
    document.getElementById("productBalance");

const productsTableBody =
    document.getElementById("productsTableBody");

const productSelect =
    document.getElementById("productSelect");

const amount =
    document.getElementById("amount");

const addBalanceBtn =
    document.getElementById("addBalanceBtn");

const withdrawBalanceBtn =
    document.getElementById("withdrawBalanceBtn");

const message =
    document.getElementById("message");

async function loadProducts() {

    try {

        const response =
            await fetch(API_URL);

        const products =
            await response.json();

        displayProducts(products);
        populateProductSelect(products);

    } catch (error) {

        showMessage(
            "Failed to load products"
        );

        console.error(error);
    }
}

function displayProducts(products) {

    productsTableBody.innerHTML = "";

    products.forEach(product => {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>${product.id}</td>

            <td>${product.name}</td>

            <td>${product.balance}</td>

            <td class="actions">

                <button
                    onclick="editProduct(${product.id})">
                    Edit
                </button>

                <button
                    onclick="deleteProduct(${product.id})">
                    Delete
                </button>

            </td>
        `;

        productsTableBody.appendChild(row);
    });
}

function populateProductSelect(products) {

    productSelect.innerHTML =
        `<option value="">
            Select Product
        </option>`;

    products.forEach(product => {

        const option =
            document.createElement("option");

        option.value = product.id;

        option.textContent =
            `${product.name} - Balance: ${product.balance}`;

        productSelect.appendChild(option);
    });
}

productForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const name =
            productName.value.trim();

        const balance =
            Number(productBalance.value);

        try {

            const response =
                await fetch(API_URL, {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        name,
                        balance
                    })
                });

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            showMessage(
                "Product added successfully"
            );

            productForm.reset();

            loadProducts();

        } catch (error) {

            showMessage(error.message);

        }

    }
);

async function deleteProduct(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this product?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/${id}`,
                {
                    method: "DELETE"
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        showMessage(
            "Product deleted successfully"
        );

        loadProducts();

    } catch (error) {

        showMessage(error.message);

    }
}


async function editProduct(id) {

    const newName =
        prompt("Enter new product name:");

    if (!newName) {
        return;
    }

    const newBalance =
        prompt("Enter new balance:");

    if (newBalance === null) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/${id}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        name: newName,
                        balance: Number(newBalance)
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        showMessage(
            "Product updated successfully"
        );

        loadProducts();

    } catch (error) {

        showMessage(error.message);

    }
}

addBalanceBtn.addEventListener(
    "click",
    () => updateBalance("add")
);

withdrawBalanceBtn.addEventListener(
    "click",
    () => updateBalance("withdraw")
);


async function updateBalance(type) {

    const productId =
        productSelect.value;

    const value =
        Number(amount.value);

    if (!productId) {

        showMessage(
            "Please select a product"
        );

        return;
    }

    if (!value || value <= 0) {

        showMessage(
            "Please enter a valid amount"
        );

        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/${productId}/balance`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        amount: value,
                        type: type
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        showMessage(
            type === "add"
                ? "Balance added successfully"
                : "Balance withdrawn successfully"
        );

        amount.value = "";

        loadProducts();

    } catch (error) {

        showMessage(error.message);

    }
}

function showMessage(text) {

    message.textContent = text;

    setTimeout(() => {
        message.textContent = "";
    }, 3000);
}

loadProducts();