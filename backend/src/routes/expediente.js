import { Router } from 'express';
import {
  listarExpediente, subirDocumento,
  actualizarDocumento, eliminarDocumento, descargarDocumento,
} from '../controllers/expedienteController.js';
import { uploadDiligencia, handleUpload } from '../middleware/upload.js';

export const expedienteRouter = Router({ mergeParams: true });

expedienteRouter.get('/',                listarExpediente);
expedienteRouter.post('/', handleUpload(uploadDiligencia), subirDocumento);
expedienteRouter.put('/:docId',          actualizarDocumento);
expedienteRouter.delete('/:docId',       eliminarDocumento);
expedienteRouter.get('/:docId/descargar', descargarDocumento);
