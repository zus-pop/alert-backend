import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    Res,
    UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
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
  async googleAuthRedirect(
    @Query('state') state: string,
    @WhoAmI() me: StudentDocument,
    @Res() res: Response,
  ) {
    const json: string = Buffer.from(state, 'base64').toString('utf-8');

    const { path }: { path: string } = JSON.parse(json);
    const result = await this.authService.loginGoogle(me);
    res.redirect(`${path}?access_token=${result.access_token}`);
  }
}
