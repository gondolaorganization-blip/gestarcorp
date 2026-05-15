import { Router } from 'express';
import {
  listarActas, obtenerActa, crearActa, actualizarActa, eliminarActa,
  calcularQuorumEndpoint, obtenerPlantilla,
  generarActaPDF, generarActaWord,
} from '../controllers/actasController.js';
import { requireAuth, requireAgente } from '../middleware/auth.js';

export const actasRouter = Router({ mergeParams: true });

actasRouter.use(requireAuth, requireAgente);

// CRUD
actasRouter.get('/',                     listarActas);
actasRouter.post('/',                    crearActa);
actasRouter.get('/plantilla/:tipo',      obtenerPlantilla);      // agenda sugerida por tipo
actasRouter.post('/quorum',              calcularQuorumEndpoint);
actasRouter.get('/:actaId',              obtenerActa);
actasRouter.put('/:actaId',              actualizarActa);
actasRouter.delete('/:actaId',           eliminarActa);

// Generadores
actasRouter.get('/:actaId/pdf',          generarActaPDF);
actasRouter.get('/:actaId/docx',         generarActaWord);
