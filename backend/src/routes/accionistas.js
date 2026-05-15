import { Router } from 'express';
import {
  listarAccionistas, obtenerAccionista, crearAccionista,
  actualizarAccionista, eliminarAccionista,
  listarHistorial, exportarPDF, exportarWord,
} from '../controllers/accionistasController.js';
import { requireAuth, requireAgente } from '../middleware/auth.js';

export const accionistasRouter = Router({ mergeParams: true });

accionistasRouter.use(requireAuth, requireAgente);

accionistasRouter.get('/',                listarAccionistas);   // ?fecha=YYYY-MM-DD para histórico
accionistasRouter.post('/',               crearAccionista);
accionistasRouter.get('/historial',       listarHistorial);
accionistasRouter.get('/exportar/pdf',    exportarPDF);
accionistasRouter.get('/exportar/docx',   exportarWord);
accionistasRouter.get('/:acId',           obtenerAccionista);
accionistasRouter.put('/:acId',           actualizarAccionista);
accionistasRouter.delete('/:acId',        eliminarAccionista);
