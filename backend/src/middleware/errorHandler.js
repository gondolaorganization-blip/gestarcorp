export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Datos inválidos',
      detalles: err.errors.map(e => ({ campo: e.path.join('.'), mensaje: e.message }))
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Ya existe un registro con esos datos únicos.' });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Registro no encontrado.' });
  }

  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  res.status(500).json({ error: 'Error interno del servidor.' });
}

export function notFound(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
}
