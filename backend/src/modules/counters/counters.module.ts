import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Counter, CounterSchema } from './schemas/counter.schema';
import { CountersService } from './counters.service';
import { CountersController } from './counters.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Counter.name, schema: CounterSchema }])
  ],
  controllers: [CountersController],
  providers: [CountersService],
  exports: [MongooseModule],
})
export class CountersModule {}