#!/usr/bin/env node
// Test the Icegram subscriber POST end-to-end.
// Reads WP_USERNAME / WP_APP_PASSWORD / ICEGRAM_API_URL from .env.local.
// Usage: node scripts/icegram-test.js [optional-list-id]

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

const URL = (process.env.ICEGRAM_API_URL || "https://awakeningdestiny.global").replace(/\/$/, "");
const USER = process.env.WP_USERNAME;
const PASS = (process.env.WP_APP_PASSWORD || "").replace(/\s+/g, "");
const LIST_ID = process.argv[2] || process.env.ICEGRAM_LIST_ID || "";

if (!USER || !PASS) {
  console.error("ERROR: WP_USERNAME and WP_APP_PASSWORD must be set in .env.local");
  process.exit(1);
}

const auth = "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");
const endpoint = `${URL}/wp-json/email-subscribers/v1/subscribers`;

async function probe(label, opts) {
  console.log(`\n→ ${label}`);
  console.log(`  ${opts.method || "GET"} ${endpoint}`);
  if (opts.body) console.log(`  body: ${opts.body}`);
  try {
    const res = await fetch(endpoint, opts);
    const text = await res.text();
    console.log(`  status ${res.status}`);
    console.log(`  body: ${text.slice(0, 1500)}${text.length > 1500 ? "..." : ""}`);
  } catch (err) {
    console.error(`  ERROR: ${err.message}`);
  }
}

async function main() {
  console.log(`Auth: Basic ${USER}:****  (${PASS.length} chars)`);
  console.log(`URL:  ${endpoint}`);
  if (LIST_ID) console.log(`Trying list ID: ${LIST_ID}`);

  // 1. GET to verify auth works
  await probe("GET subscribers (verify auth)", {
    method: "GET",
    headers: { Accept: "application/json", Authorization: auth },
  });

  // 2. POST a sample subscriber — different shapes Icegram accepts vary by version
  const baseSub = {
    email: `test+${Date.now()}@example.com`,
    first_name: "Test",
    last_name: "User",
    status: "subscribed",
  };

  await probe("POST subscriber (list_ids field)", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: JSON.stringify({ ...baseSub, list_ids: LIST_ID ? [LIST_ID] : [] }),
  });

  await probe("POST subscriber (lists field)", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: JSON.stringify({ ...baseSub, email: `test2+${Date.now()}@example.com`, lists: LIST_ID ? [LIST_ID] : [] }),
  });

  await probe("POST subscriber (list_id singular)", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: JSON.stringify({ ...baseSub, email: `test3+${Date.now()}@example.com`, list_id: LIST_ID }),
  });
}

main();
