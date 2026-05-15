import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import 'express-async-errors';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter }           from './routes/auth.js';
import { sociedadesRouter }      from './routes/sociedades.js';
import { portalRouter }          from './routes/portal.js';
import { dashboardRouter }       from './routes/dashboard.js';
import { suscripcionesRouter }   from './routes/suscripciones.js';
import { reportesRouter }        from './routes/reportes.js';
import { alertasBeneficiarios } from './controllers/beneficiariosController.js';
import { listarTodasConsultas, estadisticasConsultas } from './controllers/consultasController.js';
import { alertasObligaciones, obligacionesGlobal, dispararVerificacion } from './controllers/alertasController.js';
import { iniciarCronObligaciones } from './jobs/verificarObligaciones.js';
import { requireAuth, requireAgente } from './middleware/auth.js';
import prisma from './utils/prisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'GESTARGOV', version: '1.0.0' });
});

app.get('/api/setup/status', async (_req, res) => {
  const total = await prisma.usuario.count();
  res.json({ configurado: total > 0 });
});

app.use('/api/auth',           authRouter);
app.use('/api/sociedades',     sociedadesRouter);
app.use('/api/portal',         portalRouter);
app.use('/api/dashboard',      dashboardRouter);
app.use('/api/suscripciones',  suscripcionesRouter);
app.use('/api/reportes',       reportesRouter);
app.get('/api/alertas/beneficiarios',           requireAuth, requireAgente, alertasBeneficiarios);
app.get('/api/alertas/obligaciones',            requireAuth, requireAgente, alertasObligaciones);
app.get('/api/alertas/obligaciones/global',     requireAuth, requireAgente, obligacionesGlobal);
app.post('/api/alertas/obligaciones/verificar', requireAuth, requireAgente, dispararVerificacion);
app.get('/api/consultas',                       requireAuth, requireAgente, listarTodasConsultas);
app.get('/api/consultas/estadisticas',          requireAuth, requireAgente, estadisticasConsultas);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`GESTARGOV API corriendo en http://localhost:${PORT}`);
  iniciarCronObligaciones();
});

export default app;
