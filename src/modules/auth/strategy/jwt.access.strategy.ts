import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PayloadDto } from '../dto';
import { InjectModel } from '@nestjs/mongoose';
import { SystemUser } from '../../../shared/schemas/system-user.schema';
import { Model } from 'mongoose';
import { Student } from '../../../shared/schemas/student.schema';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(
    configService: ConfigService,
    @InjectModel(SystemUser.name) private systemUserModel: Model<SystemUser>,
    @InjectModel(Student.name) private studentModel: Model<Student>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') as string,
      ignoreExpiration: false,
    });
  }

  async validate(payload: PayloadDto) {
    if (payload.type === 'System')
      return this.systemUserModel
        .findById(payload.sub)
        .select('-password -__v');
    else
      return this.studentModel.findById(payload.sub).select('-password -__v');
  }
}
