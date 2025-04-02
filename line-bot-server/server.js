import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const LINE_TOKEN = "ZklVifJPnjnCdb3GiabOWCSdx34J+OiJf6uv/+dY5+iVXIKGgrkaHy/vUNQSv+jCYxkLUqSpwO/IHn0+iiyt0St6DaRb84kHYosUgjdHXZnXcvrwgdt0ErSn1cdF+uAPFTsmMDYbUzsdxDKHip+2eQdB04t89/1O/w1cDnyilFU=";
const USER_ID = "C81d532e59594879a230da92782e11eca";

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

app.listen(3000, () => console.log("✅ Server running on http://localhost:3000"));
