import { Router } from 'express';
import {
  portalObtenerSociedad,
  portalListarDirectores,
} from '../controllers/sociedadesController.js';
import { portalListarAcciones }                       from '../controllers/accionesController.js';
import { portalListarAccionistas }                    from '../controllers/accionistasController.js';
import { portalListarActas, portalDescargarActaPDF }  from '../controllers/actasController.js';
import {
  portalListarBeneficiarios, portalDeclararBeneficiario,
  portalActualizarBeneficiario, portalCargarDocumento,
} from '../controllers/beneficiariosController.js';
import {
  portalListarConsultas, portalCrearConsulta,
  portalObtenerConsulta, portalCuotaConsultas,
} from '../controllers/consultasController.js';
import { portalListarObligaciones } from '../controllers/alertasController.js';
import { uploadIdentidad, uploadDiligencia, handleUpload } from '../middleware/upload.js';
import { requirePortal } from '../middleware/auth.js';
import { portalObtenerCompletitud } from '../controllers/completitudController.js';
import {
  completarDatosSociedad, completarDirector, completarAccionista, subirDocumentoPortal,
} from '../controllers/portalCompletarController.js';

export const portalRouter = Router();

portalRouter.use(requirePortal);

portalRouter.get('/sociedad',            portalObtenerSociedad);
portalRouter.get('/sociedad/directores', portalListarDirectores);
portalRouter.get('/sociedad/accionistas',portalListarAccionistas);
portalRouter.get('/sociedad/acciones',         portalListarAcciones);
portalRouter.get('/sociedad/actas',             portalListarActas);
portalRouter.get('/sociedad/actas/:actaId/pdf', portalDescargarActaPDF);

// Beneficiarios finales — autodeclaración del cliente
portalRouter.get('/sociedad/beneficiarios',          portalListarBeneficiarios);
portalRouter.post('/sociedad/beneficiarios',         portalDeclararBeneficiario);
portalRouter.put('/sociedad/beneficiarios/:bId',     portalActualizarBeneficiario);
portalRouter.post(
  '/sociedad/beneficiarios/:bId/documento',
  handleUpload(uploadIdentidad),
  portalCargarDocumento
);

// Obligaciones fiscales — vista informativa del cliente
portalRouter.get('/obligaciones', portalListarObligaciones);

// Consultas — autodeclaración del cliente
portalRouter.get('/consultas/cuota',  portalCuotaConsultas);
portalRouter.get('/consultas',        portalListarConsultas);
portalRouter.post('/consultas',       portalCrearConsulta);
portalRouter.get('/consultas/:cId',   portalObtenerConsulta);

// Completitud — el cliente ve su estado y puede completar datos
portalRouter.get('/completitud',                     portalObtenerCompletitud);
portalRouter.put('/completar/sociedad',              completarDatosSociedad);
portalRouter.put('/completar/directores/:id',        completarDirector);
portalRouter.put('/completar/accionistas/:id',       completarAccionista);
portalRouter.post('/completar/documentos',           handleUpload(uploadDiligencia), subirDocumentoPortal);
