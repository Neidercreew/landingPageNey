// Temporal: se reemplaza en el paso de backend
exports.handler = async () => ({
  statusCode: 501,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ success: false, message: "Función en construcción" }),
});