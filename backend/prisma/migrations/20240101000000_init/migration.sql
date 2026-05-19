-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('STRIPE', 'YAPPY', 'TRANSFERENCIA', 'EFECTIVO');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('SUPERADMIN', 'AGENTE');

-- CreateEnum
CREATE TYPE "EstadoSociedad" AS ENUM ('ACTIVA', 'INACTIVA', 'DISUELTA');

-- CreateEnum
CREATE TYPE "PlanCliente" AS ENUM ('MENSUAL', 'ANUAL', 'FUNDADOR');

-- CreateEnum
CREATE TYPE "TipoAcciones" AS ENUM ('NOMINATIVAS', 'AL_PORTADOR', 'MIXTAS');

-- CreateEnum
CREATE TYPE "CargoDirector" AS ENUM ('PRESIDENTE', 'SECRETARIO', 'TESORERO', 'DIRECTOR', 'DIRECTOR_SUPLENTE', 'AGENTE_RESIDENTE');

-- CreateEnum
CREATE TYPE "ClaseAccion" AS ENUM ('COMUN', 'PREFERIDA', 'SERIE_A', 'SERIE_B', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoAccion" AS ENUM ('VIGENTE', 'TRANSFERIDA', 'CANCELADA', 'PIGNORADA');

-- CreateEnum
CREATE TYPE "TipoActa" AS ENUM ('ASAMBLEA_ORDINARIA', 'ASAMBLEA_EXTRAORDINARIA', 'JUNTA_DIRECTIVA', 'RESOLUCION', 'NOMBRAMIENTO_DIGNATARIOS', 'APROBACION_ESTADOS_FINANCIEROS', 'DISTRIBUCION_DIVIDENDOS', 'AUMENTO_CAPITAL', 'CAMBIO_DOMICILIO', 'DISOLUCION_LIQUIDACION', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoActa" AS ENUM ('BORRADOR', 'FIRMADA', 'PROTOCOLIZADA');

-- CreateEnum
CREATE TYPE "TipoControl" AS ENUM ('DIRECTO', 'INDIRECTO', 'DIRECTO_E_INDIRECTO');

-- CreateEnum
CREATE TYPE "TipoPoder" AS ENUM ('GENERAL', 'ESPECIAL', 'JUDICIAL', 'ADMINISTRATIVO');

-- CreateEnum
CREATE TYPE "TipoDocumento2" AS ENUM ('PACTO_SOCIAL', 'PODER_GENERAL', 'PODER_ESPECIAL', 'RESOLUCION_APERTURA_CUENTA', 'CERTIFICADO_INCUMBENCIA', 'CERTIFICADO_BUENA_STANDING', 'CERTIFICADO_ACCIONES', 'DECLARACION_JURADA_DIRECTOR', 'CARTA_RENUNCIA_DIRECTOR', 'ACEPTACION_CARGO_DIRECTOR', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoDocumento" AS ENUM ('BORRADOR', 'FINAL', 'PROTOCOLIZADO');

-- CreateEnum
CREATE TYPE "EstadoAviso" AS ENUM ('PENDIENTE', 'PAGADO', 'VENCIDO', 'EXENTO');

-- CreateEnum
CREATE TYPE "TipoConsulta" AS ENUM ('GENERAL', 'LEGAL', 'FISCAL', 'DOCUMENTAL', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoConsulta" AS ENUM ('ABIERTA', 'EN_PROCESO', 'RESUELTA', 'CERRADA');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('CEDULA', 'PASAPORTE', 'RUC', 'OTRO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'AGENTE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sociedades" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ficha" TEXT,
    "tomo" TEXT,
    "folio" TEXT,
    "fechaConstitucion" TIMESTAMP(3),
    "duracion" TEXT DEFAULT 'Perpetua',
    "domicilio" TEXT,
    "capital" DECIMAL(15,2),
    "tipoAcciones" "TipoAcciones" DEFAULT 'NOMINATIVAS',
    "cantidadAcciones" INTEGER,
    "valorNominal" DECIMAL(15,2),
    "estado" "EstadoSociedad" NOT NULL DEFAULT 'ACTIVA',
    "planCliente" "PlanCliente" NOT NULL DEFAULT 'MENSUAL',
    "fechaVencimiento" TIMESTAMP(3),
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "agenteId" TEXT,

    CONSTRAINT "sociedades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accionistas" (
    "id" TEXT NOT NULL,
    "sociedadId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoDocumento" "TipoDocumento" NOT NULL,
    "numeroDocumento" TEXT NOT NULL,
    "nacionalidad" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "domicilio" TEXT,
    "cantidadAcciones" INTEGER NOT NULL DEFAULT 0,
    "porcentaje" DECIMAL(5,2),
    "fechaIngreso" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accionistas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "directores" (
    "id" TEXT NOT NULL,
    "sociedadId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoDocumento" "TipoDocumento" NOT NULL,
    "numeroDocumento" TEXT NOT NULL,
    "nacionalidad" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "domicilio" TEXT,
    "cargo" "CargoDirector" NOT NULL,
    "fechaNombramiento" TIMESTAMP(3),
    "fechaVencimiento" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "directores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acciones" (
    "id" TEXT NOT NULL,
    "sociedadId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clase" "ClaseAccion" NOT NULL DEFAULT 'COMUN',
    "titular" TEXT NOT NULL,
    "titularDocumento" TEXT,
    "fechaEmision" TIMESTAMP(3),
    "valorNominal" DECIMAL(15,2),
    "estado" "EstadoAccion" NOT NULL DEFAULT 'VIGENTE',
    "certificadoGenerado" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transferencias_acciones" (
    "id" TEXT NOT NULL,
    "accionId" TEXT NOT NULL,
    "cedente" TEXT NOT NULL,
    "cesionario" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "precio" DECIMAL(15,2),
    "actaId" TEXT,
    "registrado" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transferencias_acciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actas" (
    "id" TEXT NOT NULL,
    "sociedadId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "tipo" "TipoActa" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "lugar" TEXT,
    "quorum" TEXT,
    "agenda" TEXT,
    "acuerdos" TEXT,
    "estado" "EstadoActa" NOT NULL DEFAULT 'BORRADOR',
    "documento" TEXT,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiarios_finales" (
    "id" TEXT NOT NULL,
    "sociedadId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoDocumento" "TipoDocumento" NOT NULL,
    "numeroDocumento" TEXT NOT NULL,
    "nacionalidad" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "domicilio" TEXT,
    "porcentajeControl" DECIMAL(5,2),
    "tipoControl" "TipoControl" NOT NULL DEFAULT 'DIRECTO',
    "esPEP" BOOLEAN NOT NULL DEFAULT false,
    "cargoPublico" TEXT,
    "fechaDeclaracion" TIMESTAMP(3),
    "fechaActualizacion" TIMESTAMP(3),
    "documentoIdentidad" TEXT,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiarios_finales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pactos_sociales" (
    "id" TEXT NOT NULL,
    "sociedadId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "estado" "EstadoDocumento" NOT NULL DEFAULT 'BORRADOR',
    "contenido" TEXT,
    "fechaGenerado" TIMESTAMP(3),
    "notaria" TEXT,
    "tomo" TEXT,
    "folio" TEXT,
    "fechaProtocolizacion" TIMESTAMP(3),
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pactos_sociales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poderes" (
    "id" TEXT NOT NULL,
    "sociedadId" TEXT NOT NULL,
    "tipo" "TipoPoder" NOT NULL,
    "poderdante" TEXT NOT NULL,
    "apoderado" TEXT NOT NULL,
    "facultades" TEXT,
    "fechaOtorgamiento" TIMESTAMP(3),
    "fechaVencimiento" TIMESTAMP(3),
    "notaria" TEXT,
    "tomo" TEXT,
    "folio" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "poderes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_societarios" (
    "id" TEXT NOT NULL,
    "sociedadId" TEXT NOT NULL,
    "tipo" "TipoDocumento2" NOT NULL,
    "nombre" TEXT NOT NULL,
    "archivo" TEXT,
    "fechaGenerado" TIMESTAMP(3),
    "fechaVencimiento" TIMESTAMP(3),
    "estado" "EstadoDocumento" NOT NULL DEFAULT 'BORRADOR',
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_societarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avisos_operacion" (
    "id" TEXT NOT NULL,
    "sociedadId" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "estado" "EstadoAviso" NOT NULL DEFAULT 'PENDIENTE',
    "monto" DECIMAL(10,2),
    "fechaVence" TIMESTAMP(3) NOT NULL,
    "fechaPago" TIMESTAMP(3),
    "comprobante" TEXT,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avisos_operacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultas" (
    "id" TEXT NOT NULL,
    "sociedadId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "tipo" "TipoConsulta" NOT NULL DEFAULT 'GENERAL',
    "descripcion" TEXT NOT NULL,
    "estado" "EstadoConsulta" NOT NULL DEFAULT 'ABIERTA',
    "respuesta" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaRespuesta" TIMESTAMP(3),
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_accesos" (
    "id" TEXT NOT NULL,
    "sociedadId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "ultimoAcceso" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "tokenReset" TEXT,
    "tokenResetVence" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portal_accesos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "acciones_sociedadId_numero_key" ON "acciones"("sociedadId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "actas_sociedadId_numero_key" ON "actas"("sociedadId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "avisos_operacion_sociedadId_anio_key" ON "avisos_operacion"("sociedadId", "anio");

-- CreateIndex
CREATE UNIQUE INDEX "portal_accesos_sociedadId_key" ON "portal_accesos"("sociedadId");

-- CreateIndex
CREATE UNIQUE INDEX "portal_accesos_email_key" ON "portal_accesos"("email");

-- AddForeignKey
ALTER TABLE "sociedades" ADD CONSTRAINT "sociedades_agenteId_fkey" FOREIGN KEY ("agenteId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accionistas" ADD CONSTRAINT "accionistas_sociedadId_fkey" FOREIGN KEY ("sociedadId") REFERENCES "sociedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "directores" ADD CONSTRAINT "directores_sociedadId_fkey" FOREIGN KEY ("sociedadId") REFERENCES "sociedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acciones" ADD CONSTRAINT "acciones_sociedadId_fkey" FOREIGN KEY ("sociedadId") REFERENCES "sociedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias_acciones" ADD CONSTRAINT "transferencias_acciones_accionId_fkey" FOREIGN KEY ("accionId") REFERENCES "acciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actas" ADD CONSTRAINT "actas_sociedadId_fkey" FOREIGN KEY ("sociedadId") REFERENCES "sociedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiarios_finales" ADD CONSTRAINT "beneficiarios_finales_sociedadId_fkey" FOREIGN KEY ("sociedadId") REFERENCES "sociedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pactos_sociales" ADD CONSTRAINT "pactos_sociales_sociedadId_fkey" FOREIGN KEY ("sociedadId") REFERENCES "sociedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poderes" ADD CONSTRAINT "poderes_sociedadId_fkey" FOREIGN KEY ("sociedadId") REFERENCES "sociedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_societarios" ADD CONSTRAINT "documentos_societarios_sociedadId_fkey" FOREIGN KEY ("sociedadId") REFERENCES "sociedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avisos_operacion" ADD CONSTRAINT "avisos_operacion_sociedadId_fkey" FOREIGN KEY ("sociedadId") REFERENCES "sociedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_sociedadId_fkey" FOREIGN KEY ("sociedadId") REFERENCES "sociedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_accesos" ADD CONSTRAINT "portal_accesos_sociedadId_fkey" FOREIGN KEY ("sociedadId") REFERENCES "sociedades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

