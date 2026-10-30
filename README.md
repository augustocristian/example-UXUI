# Roof Insulation Landing Page

A one-page lead-generation site served by Node.js and Express. Visitors fill in a short quote form, and each request is validated, stored and optionally forwarded to a webhook.

## Run locally

```bash
npm install
npm start
```

Open http://localhost:3000. Use `npm run dev` to restart on file changes.

## Project structure

```
server.js          Express server, security headers, /api/quote, /healthz
public/index.html  The page (HTML, no build step)
public/styles.css  All styles; colours and fonts are CSS variables at the top
public/main.js     Form validation and submission
public/favicon.svg
Dockerfile         Container image
```

## Fill in your content

Everything in square brackets is a placeholder: `[YOUR BRAND]`, `[YOUR PHONE]`, `[−20%]`, `[OFFER DEADLINE]`, the photos, the reviews, and the footer details. Search for `[` in `public/index.html` and replace each one with your real information. Do not publish invented reviews or statistics.

- **Photos:** put images in `public/images/` and add `style="background-image:url('/images/photo.jpg')"` plus `class="shot has-image"` to each gallery figure.
- **Accent colour:** change `--accent` in `public/styles.css`.
- **Language:** set `lang` on `<html>` and translate the text in `index.html` and the messages in `server.js` and `public/main.js`.

## Receiving leads

Every valid submission is appended to `data/leads.jsonl` (one JSON object per line). To get notified instantly, set `LEAD_WEBHOOK_URL` and each lead is also POSTed there as JSON. Many hosts wipe the disk on redeploy, so use the webhook or mount a persistent volume on `data/`.

Spam protection: a hidden honeypot field and a limit of 5 submissions per IP per 10 minutes. Add your privacy policy link near the form if the law in your country requires it.

## Deploy

Any host that runs Node 18+ works. The server reads `PORT` from the environment and exposes `GET /healthz`.

**Render / Railway / Fly.io / Heroku:** connect the repository, build command `npm install`, start command `npm start`.

**Docker (any VPS):**

```bash
docker build -t roof-landing .
docker run -d -p 80:3000 -v $(pwd)/data:/app/data --env-file .env roof-landing
```

**VPS without Docker:**

```bash
npm install --omit=dev
PORT=3000 npm start      # keep it running with pm2 or systemd, put nginx or Caddy in front for HTTPS
```
