const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

const senha = bcrypt.hashSync('Demo@1234', 10);

async function main() {
  const roles = ['admin', 'operador', 'dono', 'gestor', 'string'];
  for (const r of roles) {
    await prisma.user.upsert({
      where: { email: `${r}@demo.app` },
      update: {},
      create: { email: `${r}@demo.app`, name: `Usuário ${r}`, passwordHash: senha, role: r, plan: 'pro' },
    });
  }
  await prisma.user.upsert({
    where: { email: 'jogador@demo.app' },
    update: {},
    create: { email: 'jogador@demo.app', name: 'Jogador Demo', passwordHash: senha, role: 'user' },
  });

  const admin = await prisma.user.findUnique({ where: { email: 'admin@demo.app' } });

  if ((await prisma.client.count()) === 0) {
    await prisma.client.createMany({
      data: [
        { name: 'Transportadora Alpha LTDA', tradeName: 'Alpha Log', document: '12.345.678/0001-90', email: 'contato@alpha.com.br', phone: '(11) 3456-7890', address: 'Av. Paulista, 1000', city: 'São Paulo', state: 'SP', zipCode: '01310-100', score: 4.7 },
        { name: 'Distribuidora Beta S.A.', tradeName: 'Beta Distrib', document: '98.765.432/0001-10', email: 'vendas@beta.com.br', phone: '(21) 2345-6789', address: 'Rua das Flores, 250', city: 'Rio de Janeiro', state: 'RJ', zipCode: '20040-020', score: 4.2 },
        { name: 'Comercial Gama ME', tradeName: 'Gama Comercial', document: '11.222.333/0001-44', email: 'gama@comercial.com', phone: '(31) 3333-4444', address: 'Av. Afonso Pena, 500', city: 'Belo Horizonte', state: 'MG', zipCode: '30130-000', score: 3.9 },
        { name: 'Indústria Delta LTDA', tradeName: 'Delta Ind', document: '55.666.777/0001-88', email: 'contato@delta.ind.br', phone: '(41) 3222-1111', address: 'Rua XV de Novembro, 800', city: 'Curitiba', state: 'PR', zipCode: '80020-310', score: 4.8 },
      ],
    });
  }

  if ((await prisma.route.count()) === 0) {
    await prisma.route.createMany({
      data: [
        { originCity: 'São Paulo', originState: 'SP', originZip: '01310-100', destinationCity: 'Rio de Janeiro', destinationState: 'RJ', destinationZip: '20040-020', distanceKm: 430, estimatedHours: 6 },
        { originCity: 'São Paulo', originState: 'SP', originZip: '01310-100', destinationCity: 'Belo Horizonte', destinationState: 'MG', destinationZip: '30130-000', distanceKm: 586, estimatedHours: 8 },
        { originCity: 'Curitiba', originState: 'PR', originZip: '80020-310', destinationCity: 'São Paulo', destinationState: 'SP', destinationZip: '01310-100', distanceKm: 408, estimatedHours: 5.5 },
        { originCity: 'Rio de Janeiro', originState: 'RJ', originZip: '20040-020', destinationCity: 'Curitiba', destinationState: 'PR', destinationZip: '80020-310', distanceKm: 850, estimatedHours: 11 },
      ],
    });
  }

  if ((await prisma.vehicle.count()) === 0) {
    await prisma.vehicle.createMany({
      data: [
        { plate: 'ABC1D23', model: 'Volvo FH 460', brand: 'Volvo', year: 2022, type: 'cavalo', capacityKg: 25000, capacityM3: 90, status: 'disponivel', currentOdometerKm: 125000 },
        { plate: 'EFG4H56', model: 'Scania R450', brand: 'Scania', year: 2021, type: 'cavalo', capacityKg: 24000, capacityM3: 85, status: 'em_viagem', currentOdometerKm: 210500 },
        { plate: 'IJK7L89', model: 'Mercedes Actros 2651', brand: 'Mercedes-Benz', year: 2023, type: 'truck', capacityKg: 16000, capacityM3: 60, status: 'disponivel', currentOdometerKm: 45000 },
        { plate: 'MNO0P12', model: 'Ford Cargo 2429', brand: 'Ford', year: 2020, type: 'truck', capacityKg: 14000, capacityM3: 55, status: 'manutencao', currentOdometerKm: 320000 },
      ],
    });
  }

  const vehicles = await prisma.vehicle.findMany();
  if ((await prisma.driver.count()) === 0) {
    await prisma.driver.createMany({
      data: [
        { name: 'Carlos Silva', document: '123.456.789-00', cnhNumber: '1234567890', cnhCategory: 'E', cnhExpiresAt: new Date('2027-05-15'), phone: '(11) 98765-4321', email: 'carlos@demo.app', type: 'proprio', salary: 4500, vehicleId: vehicles[0].id },
        { name: 'João Santos', document: '234.567.890-11', cnhNumber: '2345678901', cnhCategory: 'E', cnhExpiresAt: new Date('2026-08-20'), phone: '(21) 97654-3210', email: 'joao@demo.app', type: 'proprio', salary: 4200, vehicleId: vehicles[1].id },
        { name: 'Pedro Oliveira', document: '345.678.901-22', cnhNumber: '3456789012', cnhCategory: 'D', cnhExpiresAt: new Date('2028-03-10'), phone: '(31) 96543-2109', email: 'pedro@demo.app', type: 'agregado', commissionPercent: 12, vehicleId: vehicles[2].id },
        { name: 'Marcos Costa', document: '456.789.012-33', cnhNumber: '4567890123', cnhCategory: 'E', cnhExpiresAt: new Date('2027-11-30'), phone: '(41) 95432-1098', email: 'marcos@demo.app', type: 'proprio', salary: 4800, vehicleId: vehicles[3].id },
      ],
    });
  }

  const clients = await prisma.client.findMany();
  const routes = await prisma.route.findMany();
  const drivers = await prisma.driver.findMany();

  if ((await prisma.freightTable.count()) === 0) {
    for (const c of clients) {
      await prisma.freightTable.create({
        data: { clientId: c.id, name: `Tabela ${c.tradeName} 2025`, validFrom: new Date('2025-01-01'), validTo: new Date('2025-12-31'), cubageFactor: 300, grisPercent: 0.3, tdeValue: 50, tollValue: 120, minValue: 350 },
      });
    }
  }

  const tables = await prisma.freightTable.findMany();
  if ((await prisma.freightRate.count()) === 0) {
    for (const t of tables) {
      for (const r of routes) {
        await prisma.freightRate.create({
          data: { freightTableId: t.id, routeId: r.id, weightFrom: 0, weightTo: 1000, fixedValue: 800, pricePerKg: 1.2, minValue: 500 },
        });
      }
    }
  }

  if ((await prisma.maintenance.count()) === 0) {
    await prisma.maintenance.createMany({
      data: [
        { vehicleId: vehicles[0].id, type: 'preventiva', description: 'Troca de óleo e filtros', cost: 850, odometerKm: 120000, performedAt: new Date('2025-06-15'), nextDueAt: new Date('2025-12-15'), provider: 'Oficina Central' },
        { vehicleId: vehicles[1].id, type: 'corretiva', description: 'Reparo no sistema de freios', cost: 2300, odometerKm: 205000, performedAt: new Date('2025-07-20'), provider: 'Freios Brasil' },
        { vehicleId: vehicles[3].id, type: 'preventiva', description: 'Revisão geral 300k', cost: 3200, odometerKm: 300000, performedAt: new Date('2025-08-10'), nextDueAt: new Date('2026-02-10'), provider: 'Concessionária Ford' },
      ],
    });
  }

  if ((await prisma.fueling.count()) === 0) {
    await prisma.fueling.createMany({
      data: [
        { vehicleId: vehicles[0].id, driverId: drivers[0].id, liters: 350, pricePerLiter: 6.15, totalValue: 2152.5, odometerKm: 124500, station: 'Posto Ipiranga SP', fueledAt: new Date('2025-09-01') },
        { vehicleId: vehicles[1].id, driverId: drivers[1].id, liters: 400, pricePerLiter: 6.20, totalValue: 2480, odometerKm: 209800, station: 'Posto Shell RJ', fueledAt: new Date('2025-09-05') },
        { vehicleId: vehicles[2].id, driverId: drivers[2].id, liters: 280, pricePerLiter: 6.10, totalValue: 1708, odometerKm: 44500, station: 'Posto Petrobras MG', fueledAt: new Date('2025-09-08') },
      ],
    });
  }

  if ((await prisma.transportOrder.count()) === 0) {
    const statuses = ['emitida', 'em_transito', 'entregue', 'entregue', 'em_transito', 'emitida', 'entregue', 'cancelada'];
    for (let i = 0; i < 8; i++) {
      const c = clients[i % clients.length];
      const r = routes[i % routes.length];
      const weight = 500 + i * 250;
      const base = 800 + i * 150;
      await prisma.transportOrder.create({
        data: {
          code: `OT-2025-${String(i + 1).padStart(4, '0')}`,
          clientId: c.id, routeId: r.id,
          originAddress: 'Rua de Origem, 100', originCity: r.originCity, originState: r.originState, originZip: r.originZip,
          destinationAddress: 'Av. de Destino, 200', destinationCity: r.destinationCity, destinationState: r.destinationState, destinationZip: r.destinationZip,
          cargoDescription: `Carga geral lote ${i + 1}`, weightKg: weight, volumeM3: weight / 300, cubageWeightKg: weight, taxableWeightKg: weight, packages: 10 + i,
          freightBaseValue: base, grisValue: base * 0.003, tdeValue: 50, tollValue: 120, freightTotalValue: base + base * 0.003 + 170,
          status: statuses[i], scheduledPickupAt: new Date(`2025-09-${String(10 + i).padStart(2, '0')}`), scheduledDeliveryAt: new Date(`2025-09-${String(12 + i).padStart(2, '0')}`),
          deliveredAt: statuses[i] === 'entregue' ? new Date(`2025-09-${String(12 + i).padStart(2, '0')}`) : null,
        },
      });
    }
  }

  const orders = await prisma.transportOrder.findMany();
  if ((await prisma.oTEvent.count()) === 0) {
    for (const o of orders) {
      await prisma.oTEvent.createMany({
        data: [
          { transportOrderId: o.id, type: 'coleta', description: 'Carga coletada no remetente', latitude: -23.5505, longitude: -46.6333, registeredById: admin.id, occurredAt: new Date('2025-09-10T08:00:00') },
          { transportOrderId: o.id, type: 'transito', description: 'Em trânsito', latitude: -22.9068, longitude: -43.1729, registeredById: admin.id, occurredAt: new Date('2025-09-10T14:00:00') },
        ],
      });
    }
  }

  if ((await prisma.manifest.count()) === 0) {
    for (let i = 0; i < 3; i++) {
      const v = vehicles[i];
      const d = drivers[i];
      await prisma.manifest.create({
        data: { code: `MFT-2025-${String(i + 1).padStart(3, '0')}`, vehicleId: v.id, driverId: d.id, status: i === 0 ? 'aberto' : 'fechado', totalWeightKg: 5000 + i * 1000, totalCubageWeightKg: 5000 + i * 1000, totalVolumeM3: 20 + i * 5, capacityKg: v.capacityKg, capacityM3: v.capacityM3, departureAt: new Date(`2025-09-${String(11 + i).padStart(2, '0')}T06:00:00`), createdById: admin.id },
      });
    }
  }

  if ((await prisma.occurrence.count()) === 0) {
    await prisma.occurrence.createMany({
      data: [
        { transportOrderId: orders[1].id, type: 'atraso', description: 'Trânsito intenso na BR-116', status: 'aberta', registeredById: admin.id },
        { transportOrderId: orders[4].id, type: 'avaria', description: 'Embalagem danificada durante transporte', status: 'resolvida', resolvedAt: new Date('2025-09-15'), registeredById: admin.id },
      ],
    });
  }

  if ((await prisma.deliveryReceipt.count()) === 0) {
    for (const o of orders.filter(x => x.status === 'entregue')) {
      await prisma.deliveryReceipt.create({
        data: { transportOrderId: o.id, receiverName: 'Recebedor Demo', receiverDocument: '111.222.333-44', signatureUrl: 'https://demo.app/signature.png', latitude: -23.5505, longitude: -46.6333, deliveredAt: o.deliveredAt || new Date(), notes: 'Entrega sem avarias' },
      });
    }
  }

  if ((await prisma.invoice.count()) === 0) {
    for (let i = 0; i < 4; i++) {
      const c = clients[i];
      const sub = 5000 + i * 1500;
      await prisma.invoice.create({
        data: { number: `NF-2025-${String(i + 1).padStart(4, '0')}`, clientId: c.id, periodStart: new Date('2025-08-01'), periodEnd: new Date('2025-08-31'), issueDate: new Date('2025-09-01'), dueDate: new Date('2025-09-30'), subtotal: sub, taxes: sub * 0.12, total: sub * 1.12, status: i < 2 ? 'paga' : 'emitida' },
      });
    }
  }

  if ((await prisma.accountPayable.count()) === 0) {
    await prisma.accountPayable.createMany({
      data: [
        { description: 'Combustível frota setembro', amount: 8500, dueDate: new Date('2025-09-30'), status: 'pendente', clientId: clients[0].id, driverId: drivers[0].id },
        { description: 'Manutenção preventiva', amount: 3200, dueDate: new Date('2025-09-25'), status: 'paga', clientId: clients[1].id, driverId: drivers[1].id },
        { description: 'Pedágios rota SP-RJ', amount: 1450, dueDate: new Date('2025-10-05'), status: 'pendente', clientId: clients[2].id, driverId: drivers[2].id },
      ],
    });
  }

  if ((await prisma.driverCommission.count()) === 0) {
    for (let i = 0; i < 4; i++) {
      await prisma.driverCommission.create({
        data: { driverId: drivers[i].id, transportOrderId: orders[i].id, routeId: routes[i % routes.length].id, baseValue: 800 + i * 150, percent: 10, amount: (800 + i * 150) * 0.1, status: i < 2 ? 'paga' : 'pendente', referenceMonth: '2025-09' },
      });
    }
  }

  if ((await prisma.notification.count()) === 0) {
    await prisma.notification.createMany({
      data: [
        { userId: admin.id, title: 'Nova ordem criada', message: 'OT-2025-0001 foi criada', type: 'info', read: false },
        { userId: admin.id, title: 'Entrega concluída', message: 'OT-2025-0003 entregue com sucesso', type: 'success', read: true },
        { userId: admin.id, title: 'Ocorrência registrada', message: 'Avaria na OT-2025-0005', type: 'warning', read: false },
      ],
    });
  }

  if ((await prisma.auditLog.count()) === 0) {
    await prisma.auditLog.createMany({
      data: [
        { userId: admin.id, action: 'create', entity: 'TransportOrder', entityId: orders[0].id, description: 'Ordem de transporte criada' },
        { userId: admin.id, action: 'update', entity: 'Manifest', entityId: 'demo', description: 'Manifesto atualizado' },
      ],
    });
  }

  if ((await prisma.project.count()) === 0) {
    await prisma.project.createMany({
      data: [
        { name: 'Projeto TMS Principal', ownerId: admin.id },
        { name: 'Projeto Integração ERP', ownerId: admin.id },
      ],
    });
  }

  if ((await prisma.role.count()) === 0) {
    await prisma.role.createMany({
      data: [
        { name: 'Administrador', description: 'Acesso total ao sistema', permissions: { all: true }, isSystem: true },
        { name: 'Operador', description: 'Operação de ordens e manifestos', permissions: { orders: true, manifests: true }, isSystem: true },
        { name: 'Cliente', description: 'Acesso do cliente', permissions: { viewOwn: true }, isSystem: false },
      ],
    });
  }

  if ((await prisma.collectionRequest.count()) === 0) {
    await prisma.collectionRequest.createMany({
      data: [
        { clientId: clients[0].id, originAddress: 'Rua A, 100', originCity: 'São Paulo', originState: 'SP', originZip: '01310-100', destinationAddress: 'Av. B, 200', destinationCity: 'Rio de Janeiro', destinationState: 'RJ', destinationZip: '20040-020', cargoDescription: 'Eletrônicos', weightKg: 800, volumeM3: 3, packages: 15, status: 'pendente', scheduledFor: new Date('2025-09-20') },
        { clientId: clients[1].id, originAddress: 'Rua C, 300', originCity: 'Rio de Janeiro', originState: 'RJ', originZip: '20040-020', destinationAddress: 'Av. D, 400', destinationCity: 'Belo Horizonte', destinationState: 'MG', destinationZip: '30130-000', cargoDescription: 'Alimentos', weightKg: 1200, volumeM3: 5, packages: 25, status: 'aprovada', approvedById: admin.id, approvedAt: new Date('2025-09-12'), scheduledFor: new Date('2025-09-22') },
      ],
    });
  }
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error('[seed] ERRO:', e.message); await prisma.$disconnect(); process.exit(1); });