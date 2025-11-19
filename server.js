import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import url from "url";

const app = express();
app.use(cors());

function absoluteURL(base, relative) {
    try {
        return new URL(relative, base).toString();
    } catch {
        return relative;
    }
}

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

        const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);

        // 🔥 Reescribir TODAS las rutas internas (master, chunklists, ts, key)
        body = body.replace(
            /^(?!#)(.*)$/gm,
            (line) => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith("#")) return line;

                const absolute = absoluteURL(baseUrl, trimmed);

                return `https://hls-proxy-tveo.onrender.com/proxy?url=${absolute}`;
            }
        );

        // 🔥 Siempre como texto
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");

        return res.send(body);

    } catch (err) {
        console.error(err);
        res.status(500).send("Proxy error");
    }
});

app.listen(10000, () => console.log("HLS proxy fully running"));
