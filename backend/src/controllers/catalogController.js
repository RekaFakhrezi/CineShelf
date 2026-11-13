import { HttpError } from "../middleware/errors.js";
import { text, validateTitle, positiveInt } from "../middleware/validation.js";
export function createCatalogController(model, type) {
  const find = async (id) => {
    const item = await model.get(id);
    if (!item || item.type !== type)
      throw new HttpError(404, "Judul tidak ditemukan.");
    return item;
  };
  return {
    list: async (req, res) => {
      const page = positiveInt(req.query.page, 1, 100000),
        limit = positiveInt(req.query.limit, 12, 100);
      const q = text(req.query.q ?? "", "q", 100, false).toLocaleLowerCase(
        "id",
      );
      const genre = text(req.query.genre ?? "", "genre", 80, false);
      const all = (await model.all(type)).filter(
        (x) =>
          (!genre || x.genre === genre) &&
          `${x.title} ${x.genre} ${x.cast}`.toLocaleLowerCase("id").includes(q),
      );
      res.json({
        data: all.slice((page - 1) * limit, page * limit),
        pagination: {
          page,
          limit,
          total: all.length,
          totalPages: Math.ceil(all.length / limit),
        },
      });
    },
    detail: async (req, res) => res.json({ data: await find(req.params.id) }),
    create: async (req, res) => {
      const item = validateTitle(req.body, type);
      if (!(await model.genres()).includes(item.genre))
        throw new HttpError(
          400,
          "Genre belum tersedia. Tambahkan melalui /api/genres.",
        );
      res.status(201).json({ data: await model.create(item) });
    },
    update: async (req, res) => {
      await find(req.params.id);
      const item = validateTitle(req.body, type);
      if (!(await model.genres()).includes(item.genre))
        throw new HttpError(400, "Genre belum tersedia.");
      res.json({ data: await model.update(req.params.id, item) });
    },
    remove: async (req, res) => {
      await find(req.params.id);
      await model.remove(req.params.id);
      res.status(204).end();
    },
  };
}
