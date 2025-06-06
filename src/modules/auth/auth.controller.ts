import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthLoginDto } from './dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards';
import { WhoAmI } from './decorators';

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
}
