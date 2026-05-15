import { Router } from 'express';
import {
  listarBeneficiarios, obtenerBeneficiario, crearBeneficiario,
  actualizarBeneficiario, eliminarBeneficiario,
  cargarDocumentoIdentidad, alertasBeneficiarios,
  exportarPDF, exportarWord,
} from '../controllers/beneficiariosController.js';
import { requireAuth, requireAgente } from '../middleware/auth.js';
import { uploadIdentidad, handleUpload } from '../middleware/upload.js';

export const beneficiariosRouter = Router({ mergeParams: true });

beneficiariosRouter.use(requireAuth, requireAgente);

// CRUD
beneficiariosRouter.get('/',                  listarBeneficiarios);
beneficiariosRouter.post('/',                 crearBeneficiario);
beneficiariosRouter.get('/exportar/pdf',      exportarPDF);
beneficiariosRouter.get('/exportar/docx',     exportarWord);
beneficiariosRouter.get('/:bId',              obtenerBeneficiario);
beneficiariosRouter.put('/:bId',              actualizarBeneficiario);
beneficiariosRouter.delete('/:bId',           eliminarBeneficiario);

// Documento de identidad
beneficiariosRouter.post(
  '/:bId/documento',
  handleUpload(uploadIdentidad),
  cargarDocumentoIdentidad
);
