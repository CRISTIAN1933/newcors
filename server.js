import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import url from "url";

const app = express();
app.use(cors());

// Convierte rutas relativas -> absolutas usando el proxy
function rewriteM3U8(content, baseUrl, proxyOrigin) {
    const lines = content.split("\n");

    return lines
        .map(line => {
            line = line.trim();

            // No tocar metadatos o comentarios
            if (line.startsWith("#") || line === "") {
                return line;
            }

            // Si ya es absoluta, devolverla igual
            if (line.startsWith("http://") || line.startsWith("https://")) {
                return `${proxyOrigin}/proxy?url=${line}`;
            }

            // Ruta relativa -> convertir a absoluta
            const absoluteUrl = new url.URL(line, baseUrl).href;

            return `${proxyOrigin}/proxy?url=${absoluteUrl}`;
        })
        .join("\n");
}

app.get("/proxy", async (req, res) => {
    const target = req.query.url;

    if (!target) {
        return res.status(400).send("Missing url");
    }

    console.log("Proxying:", target);

    try {
        const response = await fetch(target, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
        });

        let contentType = response.headers.get("content-type") || "";
        res.set("Access-Control-Allow-Origin", "*");

        // Si es un archivo M3U8 -> procesarlo
        if (contentType.includes("application") && contentType.includes("mpegurl") ||
            target.endsWith(".m3u8")) {

            const text = await response.text();
            const baseUrl = target;

            const proxyOrigin = `${req.protocol}://${req.get("host")}`;

            const rewritten = rewriteM3U8(text, baseUrl, proxyOrigin);

            res.set("Content-Type", "application/vnd.apple.mpegurl");
            return res.send(rewritten);
        }

        // Si no es M3U8 (ej. .ts), hacer pipe directo
        res.set("Content-Type", contentType);
        response.body.pipe(res);

    } catch (err) {
        console.error("Proxy error:", err);
        res.status(500).send("Proxy failed: " + err.message);
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("HLS Rewriter Proxy running on port", PORT);
});
