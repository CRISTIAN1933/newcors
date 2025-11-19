import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/proxy", async (req, res) => {
    try {
        const targetUrl = req.query.url;
        if (!targetUrl) return res.status(400).send("Missing url parameter");

        const response = await fetch(targetUrl, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
                "Accept": "*/*",
                "Connection": "keep-alive"
            }
        });

        let body = await response.text();

        // 🔥 Reemplazar URL internas del playlist
        body = body.replace(/(chunklist_.*\.m3u8)/g, (match) => {
            return `https://hls-proxy-tveo.onrender.com/proxy?url=${targetUrl.replace("playlist.m3u8", match)}`;
        });

        // 🔥 Encabezado correcto para HLS
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");

        return res.send(body);

    } catch (err) {
        console.error(err);
        res.status(500).send("Proxy error");
    }
});

app.listen(10000, () => console.log("HLS proxy running"));
