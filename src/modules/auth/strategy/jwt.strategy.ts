import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PayloadDto } from '../dto';
import { InjectModel } from '@nestjs/mongoose';
import { SystemUser } from '../../system-user/system-user.schema';
import { Model } from 'mongoose';
import { Student } from '../../student/student.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    @InjectModel(SystemUser.name) private systemUserModel: Model<SystemUser>,
    @InjectModel(Student.name) private studentModel: Model<Student>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET') as string,
    });
  }

  async validate(user: PayloadDto) {
    if (user.type === 'System')
      return this.systemUserModel.findById(user.sub).select('-password -__v');
    else return this.studentModel.findById(user.sub).select('-password -__v');
  }
}
