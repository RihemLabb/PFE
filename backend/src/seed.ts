import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './app.module';
import { User, UserDocument } from './modules/users/schemas/user.schema';
import {
  Service,
  ServiceDocument,
} from './modules/services/schemas/service.schema';
import {
  Counter,
  CounterDocument,
} from './modules/counters/schemas/counter.schema';
import {
  Appointment,
  AppointmentDocument,
} from './modules/appointments/schemas/appointment.schema';
import {
  QueueEntry,
  QueueEntryDocument,
} from './modules/queue/schemas/queue-entry.schema';
import {
  AgentAssignment,
  AgentAssignmentDocument,
} from './modules/agent-assignments/schemas/agent-assignment.schema';
import { UserRole } from './common/enums/user-role.enum';
import { AppointmentStatus } from './common/enums/appointment-status.enum';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  const serviceModel = app.get<Model<ServiceDocument>>(getModelToken(Service.name));
  const counterModel = app.get<Model<CounterDocument>>(getModelToken(Counter.name));
  const appointmentModel = app.get<Model<AppointmentDocument>>(
    getModelToken(Appointment.name),
  );
  const queueEntryModel = app.get<Model<QueueEntryDocument>>(
    getModelToken(QueueEntry.name),
  );
  const assignmentModel = app.get<Model<AgentAssignmentDocument>>(
    getModelToken(AgentAssignment.name),
  );

  console.log('🌱 Resetting demo data...');
  await Promise.all([
    assignmentModel.deleteMany({}),
    queueEntryModel.deleteMany({}),
    appointmentModel.deleteMany({}),
  ]);
  await counterModel.deleteMany({});
  await serviceModel.deleteMany({});
  await userModel.deleteMany({});

  const hashedPassword = await bcrypt.hash('password123', 10);

  console.log('👤 Creating demo accounts...');
  const admin = await userModel.create({
    firstName: 'Super',
    lastName: 'Admin',
    email: 'admin@pfe.com',
    password: hashedPassword,
    role: UserRole.ADMIN,
  });

  const supervisor = await userModel.create({
    firstName: 'Sara',
    lastName: 'Supervisor',
    email: 'supervisor@pfe.com',
    password: hashedPassword,
    role: UserRole.SUPERVISOR,
  });

  const agent = await userModel.create({
    firstName: 'Agent',
    lastName: 'Guichet',
    email: 'agent@pfe.com',
    password: hashedPassword,
    role: UserRole.AGENT,
  });

  const user = await userModel.create({
    firstName: 'Client',
    lastName: 'Test',
    email: 'user@pfe.com',
    password: hashedPassword,
    role: UserRole.USER,
  });

  console.log('📋 Creating services with schedules...');
  const service1 = await serviceModel.create({
    name: 'Passport Renewal',
    description: 'Renewal of expired passports',
    avgDuration: 15,
    slotDuration: 15,
    maxCapacityPerSlot: 3,
    requiredDocs: ['Old Passport', 'ID Card'],
    openingTime: '09:00',
    closingTime: '16:00',
    workingDays: [0, 1, 2, 3, 4, 5, 6],
  });

  const service2 = await serviceModel.create({
    name: 'ID Card Issuance',
    description: 'New national ID card',
    avgDuration: 10,
    slotDuration: 20,
    maxCapacityPerSlot: 4,
    requiredDocs: ['Birth Certificate', 'Proof of Address'],
    openingTime: '08:30',
    closingTime: '15:30',
    workingDays: [0, 1, 2, 3, 4, 5, 6],
  });

  console.log('🏢 Creating counters and agent assignment...');
  const counter1 = await counterModel.create({
    name: 'Guichet Passeports',
    number: 1,
    serviceId: service1._id,
  });

  await counterModel.create({
    name: 'Guichet Carte ID',
    number: 2,
    serviceId: service2._id,
  });

  await assignmentModel.create({
    agentId: agent._id,
    counterId: counter1._id,
    date: new Date(),
    isActive: true,
  });

  console.log('📅 Creating appointments for today...');
  const todayString = new Date().toISOString().split('T')[0];
  const today = new Date(`${todayString}T00:00:00.000Z`);

  await appointmentModel.create({
    userId: user._id,
    serviceId: service1._id,
    date: today,
    timeSlot: '09:00',
    qrToken: uuidv4(),
    ticketNumber: 'PAS-001',
    status: AppointmentStatus.CONFIRMED,
  });

  await appointmentModel.create({
    userId: user._id,
    serviceId: service1._id,
    date: today,
    timeSlot: '09:15',
    qrToken: uuidv4(),
    ticketNumber: 'PAS-002',
    status: AppointmentStatus.CONFIRMED,
  });

  console.log('✅ Demo database seeded successfully.');
  console.log('');
  console.log('🔑 Demo accounts (password: password123)');
  console.log(`   - ${admin.email} (ADMIN)`);
  console.log(`   - ${supervisor.email} (SUPERVISOR)`);
  console.log(`   - ${agent.email} (AGENT → Counter 1)`);
  console.log(`   - ${user.email} (USER / mobile)`);

  await app.close();
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exitCode = 1;
});
