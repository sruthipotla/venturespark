
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors({
    origin: [
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
}));

// Log every incoming request
app.use((req, res, next) => {
    console.log("REQUEST:", req.method, req.url);
    next();
});

app.use(express.json());

// Test backend
app.get("/test", (req, res) => {
    res.send("AI Startup Advisor Backend is Working!");
});

// Gemini AI connection
app.post("/api/generate", async (req, res) => {
    try {
        const prompt = String(req.body.prompt || "").trim();

        if (!prompt) {
            return res.status(400).json({
                error: "Please enter a prompt."
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                error: "Gemini API key is missing."
            });
        }

        const { GoogleGenAI } = await import("@google/genai");

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });

        let response;

for (let attempt = 1; attempt <= 3; attempt++) {
    try {
        response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt
        });

        break;

    } catch (error) {
        const status = Number(error.status || error.code);

        const isTemporary =
            status === 503 ||
            status === 429 ||
            status === 500;

        if (!isTemporary || attempt === 3) {
            throw error;
        }

        const delay = attempt * 3000;

        console.log(`Gemini retry ${attempt}/3. Waiting ${delay}ms`);

        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

        const answer = response.text;

if (!answer) {
    throw new Error("Gemini returned an empty response.");
}

return res.json({ answer: answer });

    } catch (error) {
        console.error("Gemini error:", error);

        res.status(500).json({
            error: "Unable to generate AI response. Please try again."
        });
    }
});

// Serve website files
app.use(express.static(__dirname));

// Handle unknown routes
app.use((req, res) => {
    res.status(404).send("Route not found: " + req.method + " " + req.url);
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});

