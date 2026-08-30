import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ServicesModule } from './modules/services/services.module';
import { CountersModule } from './modules/counters/counters.module';
import { AgentAssignmentsModule } from './modules/agent-assignments/agent-assignments.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { QueueModule } from './modules/queue/queue.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { HolidaysModule } from './modules/holidays/holidays.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    AuthModule,
    UsersModule,
    ServicesModule,
    CountersModule,
    AgentAssignmentsModule,
    AppointmentsModule,
    QueueModule,
    FeedbackModule,
    HolidaysModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}
