import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { StudentDocument } from '../../shared/schemas/student.schema';
import { SystemUserDocument } from '../../shared/schemas/system-user.schema';
import { AuthService } from './auth.service';
import { WhoAmI } from './decorators';
import { AuthLoginDto, PayloadDto } from './dto';
import {
  AccessTokenAuthGuard,
  GoogleAuthGuard,
  RefreshTokenAuthGuard,
} from './guards';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() user: AuthLoginDto) {
    return this.authService.loginLocal(user);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(AccessTokenAuthGuard)
  async whoAmI(@WhoAmI() me: StudentDocument | SystemUserDocument) {
    return me;
  }

  @Get('refresh')
  @ApiBearerAuth()
  @UseGuards(RefreshTokenAuthGuard)
  async refresh(@WhoAmI() me: PayloadDto) {
    return this.authService.refreshToken({
      _id: me.sub,
      email: me.email,
      type: me.type,
    });
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
    res.redirect(
      `${path}?access_token=${result.accessToken}&refreshToken=${result.refreshToken}`,
    );
  }
}
