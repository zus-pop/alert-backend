import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { StudentModule } from '../../modules/student/student.module';

@Module({
  imports: [StudentModule],
  providers: [NotificationService],
})
export class NotificationModule {}
