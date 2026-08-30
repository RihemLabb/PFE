import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QueueEntry, QueueEntrySchema } from './schemas/queue-entry.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QueueEntry.name, schema: QueueEntrySchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class QueueDataModule {}
