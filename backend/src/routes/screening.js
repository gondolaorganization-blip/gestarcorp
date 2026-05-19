import { Router } from 'express';
import {
  listarListas, subirLista, eliminarLista,
  listarSesiones, iniciarScreening, estadoSesion, resultadosSesion, marcarRevisado,
} from '../controllers/screeningController.js';
import { uploadListaSanciones, handleUpload } from '../middleware/upload.js';
import { requireAuth, requireAgente } from '../middleware/auth.js';

export const screeningRouter = Router();
screeningRouter.use(requireAuth, requireAgente);

// Listas ONU
screeningRouter.get('/listas',              listarListas);
screeningRouter.post('/listas', handleUpload(uploadListaSanciones), subirLista);
screeningRouter.delete('/listas/:id',       eliminarLista);

// Sesiones
screeningRouter.get('/sesiones',            listarSesiones);
screeningRouter.post('/sesiones',           iniciarScreening);
screeningRouter.get('/sesiones/:id',        estadoSesion);
screeningRouter.get('/sesiones/:id/resultados', resultadosSesion);

// Resultados
screeningRouter.patch('/resultados/:resultadoId/revisado', marcarRevisado);
