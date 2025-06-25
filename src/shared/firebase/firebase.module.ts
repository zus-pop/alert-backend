import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, ServiceAccount, cert } from 'firebase-admin/app';
import { FirebaseService } from './firebase.service';

@Global()
@Module({
  imports: [],
  providers: [
    {
      provide: 'FIREBASE_APP',
      useFactory: (configService: ConfigService) => {
        const firebaseConfig = {
          type: configService.get<string>('TYPE'),
          projectId: configService.get<string>('PROJECT_ID'),
          private_key_id: configService.get<string>('PRIVATE_KEY_ID'),
          privateKey: configService
            .get<string>('PRIVATE_KEY')
            ?.replace(/\\n/g, '\n'),
          clientEmail: configService.get<string>('CLIENT_EMAIL'),
          client_id: configService.get<string>('CLIENT_ID'),
          auth_uri: configService.get<string>('AUTH_URI'),
          token_uri: configService.get<string>('TOKEN_URI'),
          auth_provider_x509_cert_url:
            configService.get<string>('AUTH_CERT_URL'),
          client_x509_cert_url: configService.get<string>('CLIENT_CERT_URL'),
          universe_domain: configService.get<string>('UNIVERSAL_DOMAIN'),
        } as ServiceAccount;

        return initializeApp({
          credential: cert(firebaseConfig),
          databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
          storageBucket: `${firebaseConfig.projectId}.firebasestorage.app`,
        });
      },
      inject: [ConfigService],
    },
    FirebaseService,
  ],
  exports: [FirebaseService],
  controllers: [],
})
export class FirebaseModule {}
