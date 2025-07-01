import { Inject, Injectable } from '@nestjs/common';
import { App } from 'firebase-admin/app';
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';
import { getStorage } from 'firebase-admin/storage';

@Injectable()
export class FirebaseService {
  constructor(@Inject('FIREBASE_APP') private readonly app: App) {}

  async pushNotification(message: MulticastMessage) {
    return await getMessaging(this.app).sendEachForMulticast({
      ...message,
      android: {
        priority: 'high',
      },
      apns: {
        headers: {
          'apns-priority': '5',
        },
      },
    });
  }

  async uploadToCloud(folder: string, file: Express.Multer.File) {
    const bucket = getStorage(this.app).bucket();
    const filename = `${folder}/${Date.now()}-${file.originalname}`;
    const blob = bucket.file(filename);
    await blob.save(file.buffer, {
      resumable: false,
      metadata: { contentType: file.mimetype },
    });

    await blob.makePublic();
    return blob.publicUrl();
  }
}
