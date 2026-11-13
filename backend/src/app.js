import express from "express";
import cors from "cors";
import { catalogRoutes } from "./routes/catalogRoutes.js";
import { createCatalogModel } from "./models/catalogModel.js";
import { requireAdmin } from "./middleware/admin.js";
import { errorHandler, HttpError } from "./middleware/errors.js";
import { text } from "./middleware/validation.js";
export function createApp(database, config) {
  const app = express(),
    model = createCatalogModel(database),
    admin = requireAdmin(config.adminKey);
  app.disable("x-powered-by");
  app.use(cors({ origin: config.origins?.length ? config.origins : true }));
  app.use(express.json({ limit: "32kb" }));
  app.get("/api/health", async (req, res) => {
    await model.genres();
    res.json({
      status: "ok",
      service: "cineshelf-api",
      database: database.driver,
      version: "0.2.0",
    });
  });
  app.get("/api/genres", async (req, res) =>
    res.json({ data: await model.genres() }),
  );
  app.post("/api/genres", admin, async (req, res) => {
    const name = text(req.body?.name, "name", 80);
    res.status(201).json({ data: await model.addGenre(name) });
  });
  app.get("/api/home", async (req, res) => {
    const all = await model.all();
    res.json({
      data: {
        featured: all.find((x) => x.id === "f1") || all[0] || null,
        movies: all.filter((x) => x.type === "film").slice(0, 8),
        series: all.filter((x) => x.type === "serial").slice(0, 8),
        total: all.length,
      },
    });
  });
  app.post("/api/catalog/resolve", async (req, res) => {
    const ids = req.body?.ids;
    if (
      !Array.isArray(ids) ||
      ids.length > 100 ||
      ids.some((id) => typeof id !== "string" || id.length > 100)
    )
      throw new HttpError(400, "ids harus array maksimal 100 ID.");
    const items = await Promise.all(
      [...new Set(ids)].map((id) => model.get(id)),
    );
    res.json({ data: items.filter(Boolean) });
  });
  app.use("/api/movies", catalogRoutes(model, "film", admin));
  app.use("/api/series", catalogRoutes(model, "serial", admin));
  app.get("/", (req, res) =>
    res.json({
      name: "CineShelf API",
      health: "/api/health",
      movies: "/api/movies",
      series: "/api/series",
    }),
  );
  app.use((req, res) =>
    res.status(404).json({ error: { message: "Endpoint tidak ditemukan." } }),
  );
  app.use(errorHandler);
  return app;
}
