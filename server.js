import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import url from "url";

const app = express();
app.use(cors());

app.get("/proxy", async (req, res) => {
    const target = req.query.url;

    if (!target) {
        return res.status(400).send("Missing url parameter");
    }

    try {
        const parsed = url.parse(target);
        const baseUrl = `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/[^\/]*$/, "")}`;

        const response = await fetch(target, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "*/*",
                "Connection": "keep-alive"
            }
        });

        let text = await response.text();

        // 👉 Si es un .m3u8, convertir rutas relativas a absolutas
        if (target.endsWith(".m3u8")) {
            text = text.replace(/^(?!#)(.*\.m3u8)/gm, (match) => {
                return `${req.protocol}://${req.get("host")}/proxy?url=${baseUrl}/${match}`;
            });

            text = text.replace(/^(?!#)(.*\.ts)/gm, (match) => {
                return `${req.protocol}://${req.get("host")}/proxy?url=${baseUrl}/${match}`;
            });
        }

        res.set(
            "Content-Type",
            response.headers.get("content-type") || "application/vnd.apple.mpegurl"
        );
        res.send(text);

    } catch (error) {
        console.error("Proxy error:", error);
        res.status(500).send("Proxy error");
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`HLS Proxy running on port ${PORT}`);
});
