import { Router } from 'express';
import {
  listarPlantillas, obtenerPlantilla, crearPlantilla,
  actualizarPlantilla, eliminarPlantilla, generarDesadePlantilla,
} from '../controllers/plantillasController.js';
import { requireAuth, requireAgente } from '../middleware/auth.js';

export const plantillasRouter = Router();

plantillasRouter.use(requireAuth, requireAgente);

plantillasRouter.get('/',              listarPlantillas);
plantillasRouter.post('/',             crearPlantilla);
plantillasRouter.post('/generar',      generarDesadePlantilla);
plantillasRouter.get('/:id',           obtenerPlantilla);
plantillasRouter.put('/:id',           actualizarPlantilla);
plantillasRouter.delete('/:id',        eliminarPlantilla);
