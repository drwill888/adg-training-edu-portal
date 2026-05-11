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

async function main() {
  console.log(`Probing WordPress at ${URL}\n`);

  // Step 1: list all REST namespaces WordPress exposes
  console.log("Step 1: All REST namespaces available on this site\n");
  try {
    const res = await fetch(`${URL}/wp-json/`, { headers: { Accept: "application/json" } });
    const data = await res.json();
    const namespaces = data?.namespaces || [];
    console.log("Namespaces found:");
    namespaces.forEach((ns) => console.log(`  - ${ns}`));

    // Filter for anything that looks Icegram-related
    const icegramNamespaces = namespaces.filter((ns) =>
      /icegram|email-subscribers|es|ig-es/i.test(ns)
    );
    console.log("\nIcegram-looking namespaces:");
    icegramNamespaces.forEach((ns) => console.log(`  - ${ns}`));

    // Step 2: for each Icegram namespace, list its routes
    console.log("\nStep 2: Routes under each Icegram namespace\n");
    for (const ns of icegramNamespaces) {
      const rsp = await fetch(`${URL}/wp-json/${ns}`, { headers: { Accept: "application/json" } });
      const body = await rsp.json();
      console.log(`→ /wp-json/${ns}`);
      const routes = Object.keys(body?.routes || {});
      routes.forEach((r) => console.log(`    ${r}`));
      console.log();
    }
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

main();
