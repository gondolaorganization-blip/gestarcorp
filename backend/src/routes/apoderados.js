import { Router } from 'express';
import {
  listarApoderados, crearApoderado,
  actualizarApoderado, eliminarApoderado,
} from '../controllers/apoderadosController.js';

export const apoderadosRouter = Router({ mergeParams: true });

apoderadosRouter.get('/',          listarApoderados);
apoderadosRouter.post('/',         crearApoderado);
apoderadosRouter.put('/:apId',     actualizarApoderado);
apoderadosRouter.delete('/:apId',  eliminarApoderado);
