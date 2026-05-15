import { Router } from 'express';
import {
  listarAcciones, obtenerAccion, crearAccion, crearAccionesLote,
  actualizarAccion, registrarTransferencia, listarTransferencias,
  generarCertificadoPDF, generarCertificadoWord,
} from '../controllers/accionesController.js';
import { requireAuth, requireAgente } from '../middleware/auth.js';

export const accionesRouter = Router({ mergeParams: true });

accionesRouter.use(requireAuth, requireAgente);

// Libro de acciones
accionesRouter.get('/',         listarAcciones);
accionesRouter.post('/',        crearAccion);
accionesRouter.post('/lote',    crearAccionesLote);
accionesRouter.get('/:accionId',           obtenerAccion);
accionesRouter.put('/:accionId',           actualizarAccion);

// Transferencias
accionesRouter.post('/:accionId/transferir', registrarTransferencia);
accionesRouter.get('/transferencias/todas',  listarTransferencias);

// Certificados
accionesRouter.get('/:accionId/certificado/pdf',  generarCertificadoPDF);
accionesRouter.get('/:accionId/certificado/docx', generarCertificadoWord);
