"use strict";

const express = require("express");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const WEBHOOK_URL = process.env.LEAD_WEBHOOK_URL || "";
const DATA_DIR = path.join(__dirname, "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.jsonl");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

// Basic security headers (no extra dependency needed).
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "style-src 'self' https://fonts.googleapis.com",
      "font-src https://fonts.gstatic.com",
      "img-src 'self' data:",
      "script-src 'self'",
      "connect-src 'self'",
      "form-action 'self'",
      "base-uri 'self'",
    ].join("; ")
  );
  next();
});

app.use(express.json({ limit: "20kb" }));

// Tiny in-memory rate limit: 5 submissions per IP per 10 minutes.
const hits = new Map();
function rateLimit(req, res, next) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const list = (hits.get(req.ip) || []).filter((t) => now - t < windowMs);
  if (list.length >= 5) {
    return res.status(429).json({ ok: false, error: "Too many requests. Please try again later." });
  }
  list.push(now);
  hits.set(req.ip, list);
  next();
}

function clean(value, max) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

app.post("/api/quote", rateLimit, async (req, res) => {
  const body = req.body || {};

  // Honeypot: real visitors never fill this hidden field.
  if (body.website) return res.json({ ok: true });

  const lead = {
    firstName: clean(body.firstName, 80),
    lastName: clean(body.lastName, 80),
    phone: clean(body.phone, 40),
    postcode: clean(body.postcode, 20),
    email: clean(body.email, 160),
    message: clean(body.message, 2000),
    receivedAt: new Date().toISOString(),
  };

  const missing = ["firstName", "lastName", "phone", "postcode", "email", "message"].filter((k) => !lead[k]);
  if (missing.length) {
    return res.status(400).json({ ok: false, error: "Please fill in all required fields.", fields: missing });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return res.status(400).json({ ok: false, error: "Please enter a valid email address.", fields: ["email"] });
  }
  if (!/^[+()\d\s.-]{6,}$/.test(lead.phone)) {
    return res.status(400).json({ ok: false, error: "Please enter a valid phone number.", fields: ["phone"] });
  }

  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.appendFileSync(LEADS_FILE, JSON.stringify(lead) + "\n");
  } catch (err) {
    console.error("Could not store lead:", err.message);
    return res.status(500).json({ ok: false, error: "Something went wrong. Please call us instead." });
  }

  // Optional: forward the lead to Zapier, Make, Slack, a CRM, etc.
  if (WEBHOOK_URL) {
    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    }).catch((err) => console.error("Webhook failed:", err.message));
  }

  res.json({ ok: true });
});

app.get("/healthz", (req, res) => res.json({ status: "ok" }));

app.use(
  express.static(path.join(__dirname, "public"), {
    maxAge: "1h",
    extensions: ["html"],
  })
);

app.use((req, res) => res.status(404).sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => {
  console.log(`Landing page running on http://localhost:${PORT}`);
});
