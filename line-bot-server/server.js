import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

import "dotenv/config";

const LINE_TOKEN = process.env.LINE_TOKEN;
const USER_ID = process.env.USER_ID;


app.post("/send-line", async (req, res) => {
    try {
        const message = req.body.message;

        const response = await fetch("https://api.line.me/v2/bot/message/push", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${LINE_TOKEN}`
            },
            body: JSON.stringify({
                to: USER_ID,
                messages: [{ type: "text", text: message }]
            })
        });

        const result = await response.json();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));