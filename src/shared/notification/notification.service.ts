import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RespondedAlertEvent } from '../../modules/alert/events';
import { NewAlertEvent } from '../../modules/alert/events/new-alert.event';
import { StudentService } from '../../modules/student/student.service';
import { ALERT_RESPONDED_EVENT, NEW_ALERT_EVENT } from '../constant';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class NotificationService {
  private readonly logger: Logger = new Logger(NotificationService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly studentService: StudentService,
  ) {}

  @OnEvent(NEW_ALERT_EVENT, { async: true })
  async handleNewAlertEvent(event: NewAlertEvent) {
    this.logger.log(`New alert for student ${event.studentId}: ${event.title}`);
    const student = await this.studentService.findById(
      event.studentId.toString(),
    );

    if (student.deviceTokens.length === 0) {
      this.logger.warn(
        `No device tokens found for student ${event.studentId}. Skipping notification.`,
      );
      return;
    }

    this.firebaseService.pushNotification({
      tokens: student.deviceTokens,
      notification: {
        title: event.title,
        body: event.content,
        imageUrl:
          'https://firebasestorage.googleapis.com/v0/b/blood-donation-18260.firebasestorage.app/o/FCMImages%2FAiLert_small_logo_color_alpha-300x300.png?alt=media&token=a603b52b-7940-422e-baa5-93c800aa434a',
      },
      data: {
        type: 'alert',
        id: event.alertId.toString(),
      },
    });
  }

  @OnEvent(ALERT_RESPONDED_EVENT, { async: true })
  async handleRespondedAlertEvent(event: RespondedAlertEvent) {
    this.logger.log(
      `Alert responded for student ${event.studentId}: ${event.title}`,
    );

    const student = await this.studentService.findById(
      event.studentId.toString(),
    );

    if (student.deviceTokens.length === 0) {
      this.logger.warn(
        `No device tokens found for student ${event.studentId}. Skipping notification.`,
      );
      return;
    }

    this.firebaseService.pushNotification({
      tokens: student.deviceTokens,
      notification: {
        title: `Response to your alert: ${event.title}`,
        body: event.supervisorResponse?.response ?? event.content,
        imageUrl:
          'https://firebasestorage.googleapis.com/v0/b/blood-donation-18260.firebasestorage.app/o/FCMImages%2FAiLert_small_logo_color_alpha-300x300.png?alt=media&token=a603b52b-7940-422e-baa5-93c800aa434a',
      },
      data: {
        type: 'alert',
        id: event.alertId.toString(),
      },
    });
  }
}
