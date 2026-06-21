import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './modules/users/schemas/user.schema';
import { Service, ServiceDocument } from './modules/services/schemas/service.schema';
import { Counter, CounterDocument } from './modules/counters/schemas/counter.schema';
import { Appointment, AppointmentDocument } from './modules/appointments/schemas/appointment.schema';
import { UserRole } from './common/enums/user-role.enum';
import { AppointmentStatus } from './common/enums/appointment-status.enum';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  const serviceModel = app.get<Model<ServiceDocument>>(getModelToken(Service.name));
  const counterModel = app.get<Model<CounterDocument>>(getModelToken(Counter.name));
  const appointmentModel = app.get<Model<AppointmentDocument>>(getModelToken(Appointment.name));

  console.log('🌱 Starting database seeding...');

  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await userModel.create({
    firstName: 'Super',
    lastName: 'Admin',
    email: 'admin@pfe.com',
    password: hashedPassword,
    role: UserRole.ADMIN,
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

  console.log('📋 Creating services...');
  const service1 = await serviceModel.create({
    name: 'Passport Renewal',
    description: 'Renewal of expired passports',
    avgDuration: 15,
    slotDuration: 15,
    maxCapacityPerSlot: 3,
    requiredDocs: ['Old Passport', 'ID Card'],
  });

  const service2 = await serviceModel.create({
    name: 'ID Card Issuance',
    description: 'New national ID card',
    avgDuration: 10,
    slotDuration: 10,
    maxCapacityPerSlot: 5,
    requiredDocs: ['Birth Certificate'],
  });

  console.log('🏢 Creating counters...');
  await counterModel.create({
    name: 'Guichet 1',
    number: 1,
    serviceId: service1._id,
  });

  await counterModel.create({
    name: 'Guichet 2',
    number: 2,
    serviceId: service2._id,
  });

  console.log('📅 Creating appointments for today...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await appointmentModel.create({
    userId: user._id,
    serviceId: service1._id,
    date: today,
    timeSlot: '09:00',
    qrToken: uuidv4(),
    ticketNumber: 'PASS-001',
    status: AppointmentStatus.CONFIRMED,
  });

  await appointmentModel.create({
    userId: user._id,
    serviceId: service1._id,
    date: today,
    timeSlot: '09:15',
    qrToken: uuidv4(),
    ticketNumber: 'PASS-002',
    status: AppointmentStatus.CONFIRMED,
  });

  console.log('✅ Database seeding completed successfully!');
  console.log('');
  console.log('🔑 Comptes créés:');
  console.log('   - admin@pfe.com / password123 (ADMIN)');
  console.log('   - agent@pfe.com / password123 (AGENT)');
  console.log('   - user@pfe.com / password123 (USER)');

  await app.close();
  process.exit(0);
}

seed().catch((e) => {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
});