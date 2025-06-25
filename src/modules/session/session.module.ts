import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from '../../shared/schemas';
import { SessionService } from './session.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Session.name,
        schema: SessionSchema,
      },
    ]),
  ],
  controllers: [],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
