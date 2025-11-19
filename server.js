import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/proxy", async (req, res) => {
    const target = req.query.url;

    if (!target) {
        return res.status(400).send("Missing url parameter");
    }

    try {
        const response = await fetch(target, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
        });

        // copiar headers HLS importantes
        if (response.headers.has("content-type")) {
            res.set("Content-Type", response.headers.get("content-type"));
        }

        res.set("Access-Control-Allow-Origin", "*");

        // PIPE STREAMING → lo que Vercel NO soporta
        response.body.pipe(res);

    } catch (err) {
        res.status(500).send("Proxy error: " + err.message);
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`HLS Proxy running on port ${PORT}`));
