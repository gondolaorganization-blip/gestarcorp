import { Router } from 'express';
import {
  resumenCumplimiento,
  listarCapacitaciones, crearCapacitacion, eliminarCapacitacion, descargarCapacitacion,
  listarManuales, crearManual, eliminarManual, descargarManual,
  listarEvaluaciones, crearEvaluacion, eliminarEvaluacion, descargarEvaluacion,
  listarDeclaraciones, crearDeclaracion, eliminarDeclaracion, descargarDeclaracion,
} from '../controllers/cumplimientoController.js';
import { uploadCumplimiento, handleUpload } from '../middleware/upload.js';
import { requireAuth, requireAgente } from '../middleware/auth.js';

export const cumplimientoRouter = Router();
cumplimientoRouter.use(requireAuth, requireAgente);

cumplimientoRouter.get('/', resumenCumplimiento);

// Capacitaciones
cumplimientoRouter.get('/capacitaciones',             listarCapacitaciones);
cumplimientoRouter.post('/capacitaciones', handleUpload(uploadCumplimiento), crearCapacitacion);
cumplimientoRouter.delete('/capacitaciones/:id',      eliminarCapacitacion);
cumplimientoRouter.get('/capacitaciones/:id/descargar', descargarCapacitacion);

// Manual de Prevención
cumplimientoRouter.get('/manuales',                   listarManuales);
cumplimientoRouter.post('/manuales', handleUpload(uploadCumplimiento), crearManual);
cumplimientoRouter.delete('/manuales/:id',            eliminarManual);
cumplimientoRouter.get('/manuales/:id/descargar',     descargarManual);

// Evaluaciones Independientes
cumplimientoRouter.get('/evaluaciones',               listarEvaluaciones);
cumplimientoRouter.post('/evaluaciones', handleUpload(uploadCumplimiento), crearEvaluacion);
cumplimientoRouter.delete('/evaluaciones/:id',        eliminarEvaluacion);
cumplimientoRouter.get('/evaluaciones/:id/descargar', descargarEvaluacion);

// Declaraciones Juradas
cumplimientoRouter.get('/declaraciones',              listarDeclaraciones);
cumplimientoRouter.post('/declaraciones', handleUpload(uploadCumplimiento), crearDeclaracion);
cumplimientoRouter.delete('/declaraciones/:id',       eliminarDeclaracion);
cumplimientoRouter.get('/declaraciones/:id/descargar', descargarDeclaracion);
