import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { StudentDocument } from '../student/student.schema';
import { WhoAmI } from './decorators';
import { AuthLoginDto, PayloadDto } from './dto';
import { LocalAuthGuard } from './guards';
import { InjectModel } from '@nestjs/mongoose';
import { SystemUser } from '../system-user/system-user.schema';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(SystemUser.name) private systemUserModel: Model<SystemUser>,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.systemUserModel.findOne({
      email: email,
    });

    if (!user) throw new NotFoundException('Email not found');

    if (user.password === password) return user;

    throw new BadRequestException('Password in incorrect!');
  }

  async loginLocal(authLoginDto: AuthLoginDto) {
    const user = await this.validateUser(
      authLoginDto.email,
      authLoginDto.password,
    );
    return this.signToken({
      _id: user._id.toString(),
      email: user.email,
    });
  }

  async loginGoogle(user: StudentDocument) {
    return this.signToken({
      _id: user._id.toString(),
      email: user.email,
    });
  }

  async signToken(user: { _id: string; email: string }) {
    const payload: PayloadDto = {
      sub: user._id,
      email: user.email,
    };

    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: '30m',
      secret: this.configService.get<string>('JWT_SECRET'),
    });

    return {
      access_token: access_token,
    };
  }
}
