import { Router } from 'express';
import {
  listarMedidas, crearMedida, actualizarMedida, eliminarMedida, descargarMedida,
} from '../controllers/mitigadorasController.js';
import { uploadMedida, handleUpload } from '../middleware/upload.js';

export const mitigadorasRouter = Router({ mergeParams: true });

mitigadorasRouter.get('/',                 listarMedidas);
mitigadorasRouter.post('/', handleUpload(uploadMedida), crearMedida);
mitigadorasRouter.put('/:medId',           actualizarMedida);
mitigadorasRouter.delete('/:medId',        eliminarMedida);
mitigadorasRouter.get('/:medId/descargar', descargarMedida);
