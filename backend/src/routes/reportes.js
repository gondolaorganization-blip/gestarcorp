import { Router } from 'express';
import { requireAuth, requireAgente } from '../middleware/auth.js';
import {
  fichaSociedadPDF,
  fichaSociedadDocx,
  carteraPDF,
  carteraDocx,
  cumplimientoFiscalPDF,
  historialConsultasPDF,
} from '../controllers/reportesController.js';

export const reportesRouter = Router();

const auth = [requireAuth, requireAgente];

// Reportes globales
reportesRouter.get('/cartera/pdf',        ...auth, carteraPDF);
reportesRouter.get('/cartera/docx',       ...auth, carteraDocx);
reportesRouter.get('/cumplimiento/pdf',   ...auth, cumplimientoFiscalPDF);
reportesRouter.get('/consultas/pdf',      ...auth, historialConsultasPDF);

// Reportes por sociedad
reportesRouter.get('/:id/pdf',            ...auth, fichaSociedadPDF);
reportesRouter.get('/:id/docx',           ...auth, fichaSociedadDocx);
reportesRouter.get('/:id/cumplimiento/pdf', ...auth, cumplimientoFiscalPDF);
reportesRouter.get('/:id/consultas/pdf',    ...auth, historialConsultasPDF);
