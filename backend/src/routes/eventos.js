import { Router } from 'express';
import {
  listarEventos, crearEvento, actualizarEvento, eliminarEvento, descargarEvento,
} from '../controllers/eventosController.js';
import { uploadEvento, handleUpload } from '../middleware/upload.js';

export const eventosRouter = Router({ mergeParams: true });

eventosRouter.get('/',                 listarEventos);
eventosRouter.post('/', handleUpload(uploadEvento), crearEvento);
eventosRouter.put('/:eveId',           actualizarEvento);
eventosRouter.delete('/:eveId',        eliminarEvento);
eventosRouter.get('/:eveId/descargar', descargarEvento);
