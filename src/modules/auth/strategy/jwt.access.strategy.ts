import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { StudentService } from '../../student/student.service';
import { SystemUserService } from '../../system-user/system-user.service';
import { PayloadDto } from '../dto';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(
    configService: ConfigService,
    private readonly studentService: StudentService,
    private readonly systemUserService: SystemUserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') as string,
      ignoreExpiration: false,
    });
  }

  async validate(payload: PayloadDto) {
    if (payload.type === 'System')
      return this.systemUserService.findById(payload.sub);
    else return this.studentService.findById(payload.sub);
  }
}
