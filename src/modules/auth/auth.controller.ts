import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { StudentDocument } from '../student/student.schema';
import { SystemUserDocument } from '../system-user/system-user.schema';
import { AuthService } from './auth.service';
import { WhoAmI } from './decorators';
import { AuthLoginDto } from './dto';
import { GoogleAuthGuard, JwtAuthGuard } from './guards';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() user: AuthLoginDto) {
    return this.authService.loginLocal(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async whoAmI(@WhoAmI() me: StudentDocument | SystemUserDocument) {
    return me;
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @Get('google-redirect')
  @UseGuards(GoogleAuthGuard)
  googleAuthRedirect(@WhoAmI() me: StudentDocument) {
    return this.authService.loginGoogle(me);
  }
}
