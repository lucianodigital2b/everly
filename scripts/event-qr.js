#!/usr/bin/env node
/**
 * Prints a scannable join QR for an event, straight in the terminal.
 *
 *   node scripts/event-qr.js <qr_code_token>     # QR for an existing event
 *   node scripts/event-qr.js --create "Nome"     # create a throwaway event first
 *
 * The encoded value is exactly what `constants/links.ts` builds for the app
 * (`everly://upload/<token>`), so the in-app scanner (app/scan.tsx) and the QR
 * screen agree with it. --create talks to DEV_BASE_URL from services/api.ts.
 */
const fs = require("fs");
const path = require("path");
const qrcode = require("qrcode");

const API = readDevBaseUrl();

function readDevBaseUrl() {
  const src = fs.readFileSync(
    path.join(__dirname, "..", "services", "api.ts"),
    "utf8",
  );
  const m = src.match(/const DEV_BASE_URL\s*=\s*\n?\s*"([^"]+)"/);
  if (!m) throw new Error("couldn't read DEV_BASE_URL from services/api.ts");
  return m[1].replace(/\/+$/, "");
}

async function json(method, url, { token, body } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "ngrok-skip-browser-warning": "1",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${method} ${url} -> ${res.status}\n${text.slice(0, 400)}`);
  }
  if (!res.ok)
    throw new Error(`${method} ${url} -> ${res.status}\n${text.slice(0, 400)}`);
  return data;
}

async function createEvent(name) {
  const email = `qrtest+${Date.now()}@everly.test`;
  const password = "Everly12345";
  const { token } = await json("POST", `${API}/auth/register`, {
    body: { name: "QR Tester", email, password, password_confirmation: password },
  });
  const event = await json("POST", `${API}/events`, {
    token,
    body: {
      name,
      plan_id: 1,
      public: true,
      shot_limit: 10,
      reveal_time: "Instant",
    },
  });
  console.log(`conta de teste : ${email} / ${password}`);
  return event;
}

/**
 * The terminal renderer ignores `margin`, leaving a one-module quiet zone —
 * short of the four the spec asks for, which is exactly when a phone camera
 * refuses to lock on. Pad it by hand: white columns each side, white rows above
 * and below (one text row is two modules in `small` mode).
 */
function quietZone(str) {
  const ESC = String.fromCharCode(27);
  const WHITE = ESC + "[47m";
  const RESET = ESC + "[0m";
  const ansi = new RegExp(ESC + "\\[[0-9;]*m", "g");
  const lines = str.split("\n").filter((l) => l.length > 0);
  const width = lines[0].replace(ansi, "").length;
  const pad = WHITE + "    " + RESET;
  const blank = WHITE + " ".repeat(width + 8) + RESET;
  return [blank, blank, ...lines.map((l) => pad + l + pad), blank, blank].join(
    "\n",
  );
}

(async () => {
  const args = process.argv.slice(2);
  let event = null;
  let token = null;

  if (args[0] === "--create") {
    event = await createEvent(args[1] || "Teste QR");
    token = event.qr_code_token;
  } else if (args[0]) {
    token = args[0].match(/upload\/([^/?#\s]+)/i)?.[1] ?? args[0];
  } else {
    console.error(
      'uso: node scripts/event-qr.js <token> | node scripts/event-qr.js --create "Nome do evento"',
    );
    process.exit(1);
  }

  // Fails loudly if the token is dead — a QR that scans into a 404 reads as a
  // broken app rather than a stale token.
  const status = await json("GET", `${API}/upload/${token}`);
  const link = `everly://upload/${token}`;

  console.log("");
  console.log(`evento         : ${status.event?.name ?? "-"}`);
  if (event) console.log(`id             : ${event.id}`);
  console.log(`token          : ${token}`);
  console.log(`aceita uploads : ${status.active ? "sim" : "NAO"}`);
  console.log(`link           : ${link}`);
  console.log("");

  qrcode.toString(
    link,
    { type: "terminal", small: true, errorCorrectionLevel: "M" },
    (err, str) => {
      if (err) throw err;
      console.log(quietZone(str));
      const out = path.join(__dirname, "..", `event-qr-${token}.png`);
      qrcode
        .toFile(out, link, { width: 512, margin: 4 })
        .then(() => console.log(`png            : ${out}\n`));
    },
  );
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
