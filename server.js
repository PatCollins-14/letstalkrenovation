// www.letstalkrenovation.com on Hostinger (Node.js web app), set up like letstalkadu.com.
// On start it runs build.mjs (all of Pat's copy and compliance checks) and serves the built site from dist/.
// If the build fails, the last good dist/ keeps being served and /api/health says so.
// Secret keys, if any are ever needed, go in Hostinger's environment variables, never in this repo.
const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");
const express = require("express");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");
const PORT = process.env.PORT || 3000;
const APEX = (process.env.DOMAIN || "letstalkrenovation.com").replace(/^https?:\/\//, "").replace(/^www\./i, "").replace(/\/+$/, "").toLowerCase();
const WWW = "www." + APEX;

// ---------- build on start ----------
let build = { ok: false, at: null, message: "" };
try {
  const out = execFileSync(process.execPath, [path.join(ROOT, "build.mjs")], {
    cwd: ROOT, env: Object.assign({}, process.env, { DOMAIN: APEX }), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"]
  });
  build = { ok: true, at: new Date().toISOString(), message: out.trim() };
  console.log(out.trim());
} catch (e) {
  build = { ok: false, at: new Date().toISOString(), message: String((e.stderr || e.message || "")).trim().slice(0, 2000) };
  console.error("BUILD FAILED, serving the last good dist/ if there is one:\n" + build.message);
}
if (!fs.existsSync(path.join(DIST, "index.html"))) console.error("dist/index.html is missing: the site will answer 503 until a build succeeds.");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", true);

// Basic security headers
app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "SAMEORIGIN",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
  });
  next();
});

// www.letstalkrenovation.com is the only address (Pat, 2026-11-24): page loads on the bare domain move to www
app.use((req, res, next) => {
  const host = (req.headers.host || "").toLowerCase().replace(/:\d+$/, "");
  if (host === APEX && (req.method === "GET" || req.method === "HEAD") && !req.path.startsWith("/api/")) {
    res.set("Cache-Control", "public, max-age=3600");
    return res.redirect(301, "https://" + WWW + req.originalUrl);
  }
  next();
});

// Health check for Hostinger and for testing a deploy
app.get("/api/health", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ ok: build.ok && fs.existsSync(path.join(DIST, "index.html")), site: WWW, build, time: new Date().toISOString() });
});

// The built site only (dist/ never holds sources, the build script or the README)
app.use((req, res, next) => (fs.existsSync(path.join(DIST, "index.html")) ? next() : res.status(503).send("Site is being built. Please try again in a minute.")));
app.use(express.static(DIST, {
  dotfiles: "ignore",
  index: "index.html",
  setHeaders(res, file) {
    if (/\.(jpg|jpeg|png|webp|svg|ico|woff2?)$/i.test(file)) res.set("Cache-Control", "public, max-age=604800");
    else res.set("Cache-Control", "public, max-age=300");
  }
}));

// Anything else: the 404 page (it sends people to the home page)
app.use((req, res) => res.status(404).sendFile(path.join(DIST, "404.html")));

app.listen(PORT, () => console.log("letstalkrenovation.com listening on " + PORT + " (www host " + WWW + ")"));
