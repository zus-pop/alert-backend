import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { StudentService } from '../../student/student.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private readonly studentService: StudentService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') as string,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') as string,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') as string,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    if (!profile.emails || profile.emails.length === 0) {
      return done(
        new NotFoundException('No email found in profile'),
        undefined,
      );
    }
    const email = profile.emails[0].value;
    if (!email.endsWith('@fpt.edu.vn')) {
      return done(
        new BadRequestException('Email must belong to fpt.edu.vn domain'),
        undefined,
      );
    }
    const student = await this.studentService.findByEmail(email);
    student.firstName = profile._json.given_name as string;
    student.lastName = profile._json.family_name as string;
    student.image = profile._json.picture as string;
    await student.save();
    return done(null, student);
  }
}
