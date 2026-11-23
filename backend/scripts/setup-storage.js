import "../src/config/env.js";
import { connectDatabase } from "../src/config/database.js";
import { readConfig } from "../src/config/env.js";
const config = readConfig();
if (config.driver !== "supabase") throw Error("DB_DRIVER harus supabase untuk menyiapkan bucket.");
const { client } = await connectDatabase(config);
const name = "cineshelf-covers";
let { data: bucket, error } = await client.storage.getBucket(name);
if (error && !["400", "404"].includes(String(error.status || error.statusCode))) throw error;
if (!bucket) {
  const result = await client.storage.createBucket(name, { public: false, fileSizeLimit: 2097152, allowedMimeTypes: ["image/jpeg","image/png","image/webp"] });
  if (result.error) throw result.error;
  ({ data: bucket, error } = await client.storage.getBucket(name));
  if (error) throw error;
}
if (bucket.public) throw Error("Bucket sudah ada dan publik. Gunakan bucket private untuk fitur ini.");
console.log("Bucket cineshelf-covers private siap; foto memakai tautan sementara dari backend.");
