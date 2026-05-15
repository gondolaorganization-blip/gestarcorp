import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de GESTARGOV...');

  // Usuario agente residente (administrador)
  const passwordHash = await bcrypt.hash('gestargov2024', 10);

  const agente = await prisma.usuario.upsert({
    where: { email: 'admin@gestargov.com' },
    update: {},
    create: {
      email: 'admin@gestargov.com',
      passwordHash,
      nombre: 'Agente Residente',
      rol: 'AGENTE',
      activo: true,
    }
  });
  console.log(`Usuario agente creado: ${agente.email}`);

  // Sociedad de ejemplo
  const sociedad = await prisma.sociedad.upsert({
    where: { id: 'demo-sociedad-001' },
    update: {},
    create: {
      id: 'demo-sociedad-001',
      nombre: 'PANAMA HOLDING CORP, S.A.',
      ficha: '123456',
      tomo: '1234',
      folio: '567',
      fechaConstitucion: new Date('2020-03-15'),
      duracion: 'Perpetua',
      domicilio: 'Ciudad de Panamá, República de Panamá',
      capital: 10000,
      tipoAcciones: 'NOMINATIVAS',
      cantidadAcciones: 100,
      valorNominal: 100,
      estado: 'ACTIVA',
      planCliente: 'ANUAL',
      fechaVencimiento: new Date('2025-12-31'),
      agenteId: agente.id,
    }
  });
  console.log(`Sociedad demo creada: ${sociedad.nombre}`);

  // Director de ejemplo
  await prisma.director.upsert({
    where: { id: 'demo-director-001' },
    update: {},
    create: {
      id: 'demo-director-001',
      sociedadId: sociedad.id,
      nombre: 'Juan Carlos Pérez',
      tipoDocumento: 'CEDULA',
      numeroDocumento: '8-123-4567',
      nacionalidad: 'Panameña',
      cargo: 'PRESIDENTE',
      fechaNombramiento: new Date('2020-03-15'),
      activo: true,
    }
  });

  await prisma.director.upsert({
    where: { id: 'demo-director-002' },
    update: {},
    create: {
      id: 'demo-director-002',
      sociedadId: sociedad.id,
      nombre: 'María González',
      tipoDocumento: 'CEDULA',
      numeroDocumento: '4-567-8901',
      nacionalidad: 'Panameña',
      cargo: 'SECRETARIO',
      fechaNombramiento: new Date('2020-03-15'),
      activo: true,
    }
  });

  // Accionista de ejemplo
  await prisma.accionista.upsert({
    where: { id: 'demo-accionista-001' },
    update: {},
    create: {
      id: 'demo-accionista-001',
      sociedadId: sociedad.id,
      nombre: 'Juan Carlos Pérez',
      tipoDocumento: 'CEDULA',
      numeroDocumento: '8-123-4567',
      nacionalidad: 'Panameña',
      cantidadAcciones: 100,
      porcentaje: 100,
      fechaIngreso: new Date('2020-03-15'),
      activo: true,
    }
  });

  // Obligaciones fiscales del año en curso
  const obligaciones = [
    {
      tipo: 'AVISO_OPERACION',
      entidad: 'Ministerio de Comercio e Industrias (MICI)',
      descripcion: 'Aviso de Operación Anual',
      monto: 300,
      fechaVence: new Date('2025-03-31'),
    },
    {
      tipo: 'TASA_UNICA',
      entidad: 'Registro Público de Panamá',
      descripcion: 'Tasa Única Anual — capital hasta $10,000',
      monto: 300,
      // Vence en el mes de constitución (marzo = mes 3)
      fechaVence: new Date('2025-03-31'),
    },
    {
      tipo: 'DECLARACION_RENTA',
      entidad: 'Dirección General de Ingresos (DGI)',
      descripcion: 'Declaración Jurada de Renta Anual',
      monto: null,
      fechaVence: new Date('2025-03-31'),
    },
    {
      tipo: 'DECLARACION_MUNICIPAL',
      entidad: 'Municipio de Panamá',
      descripcion: 'Declaración Anual Municipal — Paz y Salvo',
      monto: null,
      fechaVence: new Date('2025-03-31'),
    },
  ];

  for (const ob of obligaciones) {
    await prisma.obligacionFiscal.upsert({
      where: {
        sociedadId_tipo_anio: { sociedadId: sociedad.id, tipo: ob.tipo, anio: 2025 }
      },
      update: {},
      create: {
        sociedadId: sociedad.id,
        anio: 2025,
        estado: 'PENDIENTE',
        ...ob,
      }
    });
  }
  console.log('Obligaciones fiscales demo creadas (4 tipos).');

  // Portal de acceso para el cliente demo
  const portalHash = await bcrypt.hash('cliente2024', 10);
  await prisma.portalAcceso.upsert({
    where: { sociedadId: sociedad.id },
    update: {},
    create: {
      sociedadId: sociedad.id,
      email: 'cliente@demo.com',
      passwordHash: portalHash,
      activo: true,
    }
  });
  console.log('Portal de acceso demo creado: cliente@demo.com / cliente2024');

  console.log('\n✓ Seed completado.');
  console.log('  Agente: admin@gestargov.com / gestargov2024');
  console.log('  Cliente demo: cliente@demo.com / cliente2024');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
