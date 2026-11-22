// Explicit local database mode; the existing Supabase .env is left untouched.
process.env.DB_DRIVER = "sqlite";
await import("../src/index.js");
