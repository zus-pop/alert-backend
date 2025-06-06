import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Student } from '../student/student.schema';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PayloadDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Student.name) studentModel: Model<Student>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signToken(user: { _id: string; email: string }) {
    const payload: PayloadDto = {
      sub: user._id,
      email: user.email,
    };

    const access_token = await this.jwtService.signAsync(user, {
      expiresIn: '30m',
      secret: this.configService.get<string>('JWT_SECRET'),
    });

    return {
      access_token: access_token,
    };
  }
}
