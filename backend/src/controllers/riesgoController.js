import prisma from '../utils/prisma.js';

export async function listarEvaluaciones(req, res) {
  const evaluaciones = await prisma.evaluacionRiesgo.findMany({
    where: { sociedadId: req.params.id },
    include: { evaluadoPor: { select: { nombre: true } } },
    orderBy: { creadoEn: 'desc' },
  });
  res.json(evaluaciones);
}

export async function crearEvaluacion(req, res) {
  const { nivelRiesgo, justificacion, factoresRiesgo, proximaRevision } = req.body;

  if (!nivelRiesgo || !justificacion?.trim()) {
    return res.status(400).json({ error: 'nivelRiesgo y justificacion son requeridos.' });
  }

  await prisma.sociedad.findUniqueOrThrow({ where: { id: req.params.id } });

  // Calcular próxima revisión si no viene del cliente
  let fechaRevision;
  if (proximaRevision) {
    fechaRevision = new Date(proximaRevision);
  } else {
    fechaRevision = new Date();
    fechaRevision.setFullYear(fechaRevision.getFullYear() + (nivelRiesgo === 'ALTO' ? 1 : nivelRiesgo === 'MEDIO' ? 2 : 3));
  }

  const [evaluacion] = await prisma.$transaction([
    prisma.evaluacionRiesgo.create({
      data: {
        sociedadId:     req.params.id,
        nivelRiesgo,
        justificacion:  justificacion.trim(),
        factoresRiesgo: factoresRiesgo ? JSON.stringify(factoresRiesgo) : null,
        proximaRevision: fechaRevision,
        evaluadoPorId:  req.user?.id || null,
      },
      include: { evaluadoPor: { select: { nombre: true } } },
    }),
    prisma.sociedad.update({
      where: { id: req.params.id },
      data:  { nivelRiesgo, proximaRevisionRiesgo: fechaRevision },
    }),
  ]);

  res.status(201).json(evaluacion);
}

export async function eliminarEvaluacion(req, res) {
  await prisma.evaluacionRiesgo.delete({ where: { id: req.params.evalId } });

  // Recalcular nivel de riesgo actual desde la evaluación más reciente
  const ultima = await prisma.evaluacionRiesgo.findFirst({
    where: { sociedadId: req.params.id },
    orderBy: { creadoEn: 'desc' },
  });

  await prisma.sociedad.update({
    where: { id: req.params.id },
    data: {
      nivelRiesgo:           ultima?.nivelRiesgo           || null,
      proximaRevisionRiesgo: ultima?.proximaRevision       || null,
    },
  });

  res.status(204).send();
}
