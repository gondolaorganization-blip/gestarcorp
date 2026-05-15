import { Router } from 'express';
import {
  listarDocumentos, obtenerDocumento, actualizarDocumento, eliminarDocumento,
  generarPDF, generarDocx, generarAmbos, listarTiposDocumento,
} from '../controllers/documentosController.js';
import { requireAuth, requireAgente } from '../middleware/auth.js';

export const documentosRouter = Router({ mergeParams: true });

documentosRouter.use(requireAuth, requireAgente);

// Tipos disponibles (sin parámetros de sociedad)
documentosRouter.get('/tipos', listarTiposDocumento);

// Generación
documentosRouter.post('/generar/pdf',   generarPDF);
documentosRouter.post('/generar/docx',  generarDocx);
documentosRouter.post('/generar/ambos', generarAmbos);

// CRUD de documentos guardados
documentosRouter.get('/',           listarDocumentos);
documentosRouter.get('/:docId',     obtenerDocumento);
documentosRouter.put('/:docId',     actualizarDocumento);
documentosRouter.delete('/:docId',  eliminarDocumento);
