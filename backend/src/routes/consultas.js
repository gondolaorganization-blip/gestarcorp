import { Router } from 'express';
import {
  listarConsultas, obtenerConsulta, crearConsultaAgente,
  responderConsulta, actualizarConsulta, eliminarConsulta,
} from '../controllers/consultasController.js';
import { requireAuth, requireAgente } from '../middleware/auth.js';

export const consultasRouter = Router({ mergeParams: true });

consultasRouter.use(requireAuth, requireAgente);

consultasRouter.get('/',              listarConsultas);
consultasRouter.post('/',             crearConsultaAgente);
consultasRouter.get('/:cId',          obtenerConsulta);
consultasRouter.put('/:cId',          actualizarConsulta);
consultasRouter.put('/:cId/responder',responderConsulta);
consultasRouter.delete('/:cId',       eliminarConsulta);
