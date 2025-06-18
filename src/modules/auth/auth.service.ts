import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Student, StudentDocument } from '../../shared/schemas';
import {
  SystemUser,
  SystemUserDocument,
} from '../../shared/schemas/system-user.schema';
import { AuthLoginDto, PayloadDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(SystemUser.name) private systemUserModel: Model<SystemUser>,
    @InjectModel(Student.name) private studentModel: Model<Student>,
  ) {}

  async validateUser(
    email: string,
    password: string,
    type: 'System' | 'Student',
  ) {
    let user: StudentDocument | SystemUserDocument | null;
    if (type === 'System') {
      user = await this.systemUserModel.findOne({
        email: email,
      });
    } else {
      user = await this.studentModel.findOne({
        email: email,
      });
    }
    if (!user) throw new NotFoundException('Email not found');

    if (user.password === password) return user;

    throw new BadRequestException('Password in incorrect!');
  }

  async loginLocal(authLoginDto: AuthLoginDto) {
    const user = await this.validateUser(
      authLoginDto.email,
      authLoginDto.password,
      'System',
    );
    return this.signToken({
      sub: user._id.toString(),
      email: user.email,
      type: 'System',
    });
  }

  async loginGoogle(user: StudentDocument) {
    return this.signToken({
      sub: user._id.toString(),
      email: user.email,
      type: 'Student',
    });
  }

  async refreshToken(user: {
    _id: string;
    email: string;
    type: 'System' | 'Student';
  }) {
    const payload: PayloadDto = {
      sub: user._id,
      email: user.email,
      type: user.type,
    };

    const accessToken = await this.signToken(payload, 'accessToken');

    return accessToken;
  }

  async signToken(
    user: PayloadDto,
    option: 'accessToken' | 'refreshToken' | 'both' = 'both',
  ) {
    const accessExpiresIn = '30s';
    const refreshExpiresIn = '7d';
    const payload: PayloadDto = {
      sub: user.sub,
      email: user.email,
      type: user.type,
    };

    if (option === 'accessToken') {
      const accessToken = await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiresIn,
      });
      return { accessToken };
    }

    if (option === 'refreshToken') {
      const refreshToken = await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn,
      });
      return { refreshToken };
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
