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

async function probe(label, url) {
  console.log(`\n→ ${label}`);
  try {
    const res = await fetch(url, { headers: { Authorization: auth, Accept: "application/json" } });
    const text = await res.text();
    console.log(`  ${res.status}: ${text.slice(0, 1200)}`);
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
  }
}

async function main() {
  console.log(`User: ${USER}  Pass length: ${PASS.length}\n`);
  await probe("icegram-express/v1 root",       `${BASE}/wp-json/icegram-express/v1`);
  await probe("icegram-express/v1/lists",      `${BASE}/wp-json/icegram-express/v1/lists`);
  await probe("icegram-express/v1/subscribers",`${BASE}/wp-json/icegram-express/v1/subscribers`);
  await probe("email-subscribers/v1 root",     `${BASE}/wp-json/email-subscribers/v1`);
  await probe("email-subscribers/v1/lists",    `${BASE}/wp-json/email-subscribers/v1/lists`);
  await probe("email-subscribers/v1/forms",    `${BASE}/wp-json/email-subscribers/v1/forms`);
}

main();
