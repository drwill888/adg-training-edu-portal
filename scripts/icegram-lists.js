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

const ENDPOINTS = [
  `${URL}/wp-json/icegram-mailer/v1/lists`,
  `${URL}/wp-json/ig-es/v1/lists`,
  `${URL}/wp-json/icegram/v1/lists`,
];

async function tryEndpoint(endpoint) {
  try {
    const res = await fetch(endpoint, {
      headers: { "X-API-Key": KEY, Accept: "application/json" },
    });
    const text = await res.text();
    return { endpoint, status: res.status, body: text };
  } catch (err) {
    return { endpoint, error: err.message };
  }
}

async function main() {
  console.log(`Checking Icegram at ${URL}\n`);

  for (const ep of ENDPOINTS) {
    const result = await tryEndpoint(ep);
    console.log(`→ ${ep}`);
    if (result.error) {
      console.log(`  ERROR: ${result.error}\n`);
      continue;
    }
    console.log(`  status ${result.status}`);
    console.log(`  body: ${result.body.slice(0, 500)}${result.body.length > 500 ? "..." : ""}\n`);
  }

  console.log("Look for the response that shows a list of lists with IDs.");
  console.log('Then set ICEGRAM_LIST_ID="<id>" in .env.local.');
}

main();
