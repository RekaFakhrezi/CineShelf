import { Router } from "express";
import { createCatalogController } from "../controllers/catalogController.js";
export function catalogRoutes(model, type, admin) {
  const router = Router(),
    c = createCatalogController(model, type);
  router.get("/", c.list);
  router.get("/:id", c.detail);
  router.post("/", admin, c.create);
  router.put("/:id", admin, c.update);
  router.delete("/:id", admin, c.remove);
  return router;
}
