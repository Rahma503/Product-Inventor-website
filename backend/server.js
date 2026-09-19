const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");


const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;



const SPREADSHEET_ID =
    "1FlDq2-RlIXPVJ6VIzHASDMNtJ7_FXYs81Fai9x93g8E";

const SHEET_NAME = "Sheet1";


const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: [
        "https://www.googleapis.com/auth/spreadsheets"
    ]
});

const sheets = google.sheets({
    version: "v4",
    auth
});


app.get("/api/products", async (req, res) => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:C`
        });

        const rows = response.data.values || [];

        const products = rows.slice(1).map(row => ({
            id: Number(row[0]),
            name: row[1],
            balance: Number(row[2])
        }));

        res.json(products);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to get products"
        });
    }
});


app.get("/api/products/:id", async (req, res) => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:C`
        });

        const rows = response.data.values || [];

        const id = Number(req.params.id);

        const row = rows
            .slice(1)
            .find(row => Number(row[0]) === id);

        if (!row) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json({
            id: Number(row[0]),
            name: row[1],
            balance: Number(row[2])
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to get product"
        });
    }
});


async function getProducts() {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:C`
    });

    const rows = response.data.values || [];

    return rows.slice(1).map(row => ({
        id: Number(row[0]),
        name: row[1],
        balance: Number(row[2])
    }));
}



app.post("/api/products", async (req, res) => {
    try {
        const { name, balance } = req.body;

        if (!name || balance === undefined) {
            return res.status(400).json({
                message: "Name and balance are required"
            });
        }

        if (Number(balance) < 0) {
            return res.status(400).json({
                message: "Balance cannot be negative"
            });
        }

        const products = await getProducts();

        const newId =
            products.length > 0
                ? Math.max(...products.map(p => p.id)) + 1
                : 1;

        const newProduct = [
            newId,
            name,
            Number(balance)
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:C`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [newProduct]
            }
        });

        res.status(201).json({
            id: newId,
            name,
            balance: Number(balance)
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to add product"
        });
    }
});


app.put("/api/products/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, balance } = req.body;

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:C`
        });

        const rows = response.data.values || [];

        const rowIndex = rows
            .slice(1)
            .findIndex(row => Number(row[0]) === id);

        if (rowIndex === -1) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        const actualRow = rowIndex + 2;

        if (balance !== undefined && Number(balance) < 0) {
            return res.status(400).json({
                message: "Balance cannot be negative"
            });
        }

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A${actualRow}:C${actualRow}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [[
                    id,
                    name,
                    Number(balance)
                ]]
            }
        });

        res.json({
            id,
            name,
            balance: Number(balance)
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update product"
        });
    }
});


app.delete("/api/products/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:C`
        });

        const rows = response.data.values || [];

        const rowIndex = rows
            .slice(1)
            .findIndex(row => Number(row[0]) === id);

        if (rowIndex === -1) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        const actualRow = rowIndex + 1;

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId: 0,
                                dimension: "ROWS",
                                startIndex: actualRow,
                                endIndex: actualRow + 1
                            }
                        }
                    }
                ]
            }
        });

        res.json({
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to delete product"
        });
    }
});


app.post("/api/products/:id/balance", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { amount, type } = req.body;

        const numericAmount = Number(amount);

        if (!numericAmount || numericAmount <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than 0"
            });
        }

        if (type !== "add" && type !== "withdraw") {
            return res.status(400).json({
                message: "Type must be add or withdraw"
            });
        }

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:C`
        });

        const rows = response.data.values || [];

        const rowIndex = rows
            .slice(1)
            .findIndex(row => Number(row[0]) === id);

        if (rowIndex === -1) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        const actualRow = rowIndex + 2;

        const currentBalance =
            Number(rows[rowIndex + 1][2]);

        let newBalance;

        if (type === "add") {
            newBalance = currentBalance + numericAmount;
        } else {
            if (currentBalance < numericAmount) {
                return res.status(400).json({
                    message: "Insufficient balance"
                });
            }

            newBalance = currentBalance - numericAmount;
        }

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!C${actualRow}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [[newBalance]]
            }
        });

        res.json({
            id,
            balance: newBalance
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update balance"
        });
    }
});


app.listen(PORT, () => {
    console.log(
        `Server running on http://localhost:${PORT}`
    );
});