import { networkInterfaces } from "node:os";
import { readConfig } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { createApp } from "./app.js";
const config = readConfig(),
  db = await connectDatabase(config),
  app = createApp(db, config);
const server = app.listen(config.port, config.host, () => {
  console.log(
    `CineShelf API: http://localhost:${config.port}/api/health (${config.driver})`,
  );
  for (const list of Object.values(networkInterfaces()))
    for (const n of list || [])
      if (n.family === "IPv4" && !n.internal)
        console.log(
          `URL untuk HP satu Wi-Fi: http://${n.address}:${config.port}/api`,
        );
  console.log(
    config.adminKey
      ? "Operasi tulis terlindungi ADMIN_API_KEY."
      : "Operasi tulis nonaktif. Jalankan npm run setup untuk mengaktifkan.",
  );
});
function stop() {
  server.close(() => {
    db.close?.();
    process.exit(0);
  });
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
