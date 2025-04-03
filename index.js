import dotenv from "dotenv";
import cors from "cors";
import dns from "dns"
import express from "express";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", (req, res) => {
    res.sendFile(`${process.cwd()}/views/index.html`);
});

let urlDatabase = {};

function generateShortUrl() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let shortUrl = "";
    for (let i = 0; i < 6; i++) {
        shortUrl += chars[Math.floor(Math.random() * chars.length)];
    }
    return shortUrl;
};

app.route("/api/shorturl")
.post(
	(req, res, next) => {
		const originalUrl = req["body"]["url"];
		const hostname = new URL(originalUrl).hostname;

		dns.lookup(
			hostname,
			(err, address, family) => {
				if (err) {
					console.error(`Error resolving domain: ${err.message}`);
					return res.status(400).json({ error: "invalid url" });
				} else {
					console.log(`Domain resolved! IP: ${address}, Family: IPv${family}`);
					next();
				};
			}
		);
	},
	(req, res) => {
		const originalUrl = req["body"]["url"];
		let shortUrl = Object.keys(urlDatabase).find(key => urlDatabase[key] === originalUrl);

		if (!shortUrl) {
			shortUrl = generateShortUrl();
			urlDatabase[shortUrl] = originalUrl;
		};
		res.json({
			original_url: originalUrl,
			short_url: shortUrl
		});
	}
);
app.route("/api/shorturl/:short")
.get((req, res) => {
	const shortUrl = req.params.short;
	const originalUrl = urlDatabase[shortUrl];

	if (originalUrl) {
		res.redirect(originalUrl);
	} else {
		res.status(404).json({ error: "Short URL not found" });
	}
});

app.listen(port, () => console.log(`Server is listening on port ${port}`));
