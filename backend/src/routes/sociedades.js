import { Router } from 'express';
import {
  listarSociedades, obtenerSociedad, crearSociedad,
  actualizarSociedad, eliminarSociedad, resumenSociedad,
  listarDirectores, crearDirector, actualizarDirector, eliminarDirector,
  listarObligaciones, crearObligacion, generarObligacionesAnio, actualizarObligacion,
} from '../controllers/sociedadesController.js';
import { accionesRouter }       from './acciones.js';
import { accionistasRouter }    from './accionistas.js';
import { actasRouter }          from './actas.js';
import { beneficiariosRouter }  from './beneficiarios.js';
import { documentosRouter }     from './documentos.js';
import { consultasRouter }      from './consultas.js';
import { requireAuth, requireAgente } from '../middleware/auth.js';

export const sociedadesRouter = Router();

sociedadesRouter.use(requireAuth, requireAgente);

// Sociedades
sociedadesRouter.get('/',            listarSociedades);
sociedadesRouter.post('/',           crearSociedad);
sociedadesRouter.get('/:id',         obtenerSociedad);
sociedadesRouter.get('/:id/resumen', resumenSociedad);
sociedadesRouter.put('/:id',         actualizarSociedad);
sociedadesRouter.delete('/:id',      eliminarSociedad);

// Directores
sociedadesRouter.get('/:id/directores',            listarDirectores);
sociedadesRouter.post('/:id/directores',            crearDirector);
sociedadesRouter.put('/:id/directores/:dirId',      actualizarDirector);
sociedadesRouter.delete('/:id/directores/:dirId',   eliminarDirector);

// Obligaciones fiscales
sociedadesRouter.get('/:id/obligaciones',           listarObligaciones);
sociedadesRouter.post('/:id/obligaciones',          crearObligacion);
sociedadesRouter.post('/:id/obligaciones/generar',  generarObligacionesAnio);
sociedadesRouter.put('/:id/obligaciones/:obId',     actualizarObligacion);

// Sub-routers con mergeParams
sociedadesRouter.use('/:id/accionistas',   accionistasRouter);
sociedadesRouter.use('/:id/acciones',      accionesRouter);
sociedadesRouter.use('/:id/actas',         actasRouter);
sociedadesRouter.use('/:id/beneficiarios', beneficiariosRouter);
sociedadesRouter.use('/:id/documentos',   documentosRouter);
sociedadesRouter.use('/:id/consultas',    consultasRouter);
