#!/usr/bin/env npx tsx
/**
 * Verify a password against the stored hash.
 *
 * Usage:
 *   npx tsx server/scripts/verify-password.ts <email> <password>
 */

import pg from "pg";

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error("Usage: npx tsx server/scripts/verify-password.ts <email> <password>");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const { rows } = await client.query(
      "SELECT id, email, password_hash FROM admin_users WHERE LOWER(email) = LOWER($1)",
      [email],
    );

    if (rows.length === 0) {
      console.log("No user found with that email.");
      process.exit(1);
    }

    const user = rows[0];
    console.log("User found:", user.email);
    console.log("Hash starts with:", user.password_hash.slice(0, 20) + "...");

    const bcrypt = await import("bcrypt");
    const match = await bcrypt.default.compare(password, user.password_hash);
    console.log("Password match:", match);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
