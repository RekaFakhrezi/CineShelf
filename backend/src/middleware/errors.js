export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function errorHandler(error, req, res, next) {
  const status =
    error.type === "entity.parse.failed"
      ? 400
      : error.type === "entity.too.large"
        ? 413
        : error.status || 500;
  if (status === 500)
    console.error("[API]", error.code || error.name || "DatabaseError");
  res
    .status(status)
    .json({
      error: {
        message:
          status === 500
            ? "Server tidak dapat memproses permintaan. Periksa konfigurasi database."
            : status === 400 && error.type === "entity.parse.failed"
              ? "Body harus JSON yang valid."
              : error.message,
      },
    });
}
