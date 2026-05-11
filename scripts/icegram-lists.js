#!/usr/bin/env node
// List all Icegram subscriber lists with their IDs.
// Usage: node scripts/icegram-lists.js
// Reads ICEGRAM_API_KEY and ICEGRAM_API_URL from .env.local.

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

const KEY = process.env.ICEGRAM_API_KEY;
const URL = (process.env.ICEGRAM_API_URL || "https://awakeningdestiny.global").replace(/\/$/, "");

if (!KEY) {
  console.error("ERROR: ICEGRAM_API_KEY is missing from .env.local");
  process.exit(1);
}

async function probe(label, url, opts = {}) {
  console.log(`→ ${label}`);
  console.log(`  ${opts.method || "GET"} ${url}`);
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    console.log(`  status ${res.status}`);
    console.log(`  body: ${text.slice(0, 800)}${text.length > 800 ? "..." : ""}\n`);
  } catch (err) {
    console.error(`  ERROR: ${err.message}\n`);
  }
}

async function main() {
  console.log(`Probing email-subscribers REST API at ${URL}\n`);

  // Schema for the /subscribers endpoint (shows accepted fields + auth)
  await probe("Schema for /subscribers", `${URL}/wp-json/email-subscribers/v1/subscribers`, {
    method: "OPTIONS",
    headers: { Accept: "application/json" },
  });

  // Try GET on /subscribers with the API key (sees if we have valid auth)
  await probe(
    "GET /subscribers with X-ES-API-KEY header",
    `${URL}/wp-json/email-subscribers/v1/subscribers`,
    { headers: { "X-ES-API-KEY": KEY, Accept: "application/json" } }
  );

  // Try common alternative header names
  await probe(
    "GET /subscribers with X-API-KEY header",
    `${URL}/wp-json/email-subscribers/v1/subscribers`,
    { headers: { "X-API-KEY": KEY, Accept: "application/json" } }
  );

  // Try the same with Authorization Bearer
  await probe(
    "GET /subscribers with Authorization Bearer",
    `${URL}/wp-json/email-subscribers/v1/subscribers`,
    { headers: { Authorization: `Bearer ${KEY}`, Accept: "application/json" } }
  );

  // See if there's a lists route nested under email-subscribers
  await probe("GET email-subscribers root", `${URL}/wp-json/email-subscribers/v1`, {
    headers: { Accept: "application/json" },
  });
}

main();
