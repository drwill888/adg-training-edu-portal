#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
    });
}

const USER = process.env.WP_USERNAME;
const PASS = (process.env.WP_APP_PASSWORD || "").replace(/\s+/g, "");
const BASE = "https://awakeningdestiny.global";

if (!USER || !PASS) {
  console.error("ERROR: WP_USERNAME and WP_APP_PASSWORD must be in .env.local");
  process.exit(1);
}

const auth = "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");
const endpoint = `${BASE}/wp-json/email-subscribers/v1/subscribers`;

async function probe(label, url, opts = {}) {
  console.log(`\n→ ${label}`);
  try {
    const res = await fetch(url, {
      ...opts,
      headers: { Authorization: auth, Accept: "application/json", "Content-Type": "application/json", ...(opts.headers || {}) },
    });
    const text = await res.text();
    console.log(`  ${res.status}: ${text.slice(0, 2000)}`);
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
  }
}

async function main() {
  console.log(`User: ${USER}  Pass length: ${PASS.length}\n`);

  // GET subscribers — may reveal list IDs on existing records
  await probe("GET subscribers (first page)", endpoint);

  // OPTIONS — reveals accepted fields
  await probe("OPTIONS subscribers", endpoint, { method: "OPTIONS" });

  // POST without list — see if it works or what error we get
  await probe("POST subscriber (no list)", endpoint, {
    method: "POST",
    body: JSON.stringify({
      email: `probe+${Date.now()}@example.com`,
      first_name: "Probe",
      status: "subscribed",
    }),
  });

  // Try WP admin AJAX to get lists (some ES versions expose this)
  await probe("GET /wp-json (full namespace list)", `${BASE}/wp-json`);
}

main();
