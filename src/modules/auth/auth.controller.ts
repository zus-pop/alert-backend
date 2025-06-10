import {
    Body,
    Controller,
    Get,
    Post,
    UseGuards
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { WhoAmI } from './decorators';
import { AuthLoginDto } from './dto';
import { GoogleAuthGuard, JwtAuthGuard } from './guards';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  async login(@Body() user: AuthLoginDto) {
    return this.authService.signToken(user as any);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async test(@WhoAmI() me: any) {
    return me;
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @Get('google-redirect')
  @UseGuards(GoogleAuthGuard)
  googleAuthRedirect(@WhoAmI() me) {
    return me;
  }
}
