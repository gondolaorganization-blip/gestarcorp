import { Router } from 'express';
import { listarEvaluaciones, crearEvaluacion, eliminarEvaluacion } from '../controllers/riesgoController.js';

export const riesgoRouter = Router({ mergeParams: true });

riesgoRouter.get('/',            listarEvaluaciones);
riesgoRouter.post('/',           crearEvaluacion);
riesgoRouter.delete('/:evalId',  eliminarEvaluacion);
