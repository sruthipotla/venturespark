
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

// Groq AI connection
app.post("/api/generate", async (req, res) => {
    try {
        const prompt = String(req.body.prompt || "").trim();

        if (!prompt) {
            return res.status(400).json({
                error: "Please enter a prompt."
            });
        }

        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({
                error: "Groq API key is missing."
            });
        }

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "openai/gpt-oss-20b",
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Groq error:", data);
            return res.status(response.status).json({
                error: data.error?.message || "Groq request failed."
            });
        }

        const answer = data.choices?.[0]?.message?.content;

        if (!answer) {
            throw new Error("Groq returned an empty response.");
        }

        return res.json({ answer });

    } catch (error) {
        console.error("Groq error:", error);

        return res.status(500).json({
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

