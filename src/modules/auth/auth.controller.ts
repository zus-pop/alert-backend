import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
} from '@nestjs/swagger';
import { Response } from 'express';
import { FirebaseService } from '../../shared/firebase/firebase.service';
import { StudentDocument } from '../../shared/schemas';
import { AuthService } from './auth.service';
import { WhoAmI } from './decorators';
import {
  AuthLoginDto,
  MessageDto,
  PayloadDto,
  ProfileDto,
  PushTokenDto,
} from './dto';
import {
  AccessTokenAuthGuard,
  GoogleAuthGuard,
  RefreshTokenAuthGuard,
} from './guards';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly firebaseService: FirebaseService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() user: AuthLoginDto) {
    return this.authService.loginLocal(user);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(AccessTokenAuthGuard)
  async whoAmI(@WhoAmI() me: PayloadDto) {
    return this.authService.whoAmI(me);
  }

  @Post('me')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: ProfileDto,
  })
  @UseInterceptors(FileInterceptor('image'))
  @ApiBearerAuth()
  @UseGuards(AccessTokenAuthGuard)
  async updateProfile(
    @WhoAmI() me: PayloadDto,
    @UploadedFile() image: Express.Multer.File,
    @Body() data: ProfileDto,
  ) {
    if (image) {
      const imageUrl = await this.firebaseService.uploadToCloud(
        'avatar',
        image,
      );
      data.image = imageUrl;
    }
    const result = await this.authService.updateProfile(me, data);
    return result;
  }

  @Get('refresh')
  @ApiHeader({
    name: 'x-refresh-token',
    required: true,
    description: 'Refresh Token',
  })
  @UseGuards(RefreshTokenAuthGuard)
  async refresh(@WhoAmI() me: PayloadDto) {
    return this.authService.refreshToken({
      _id: me.sub,
      email: me.email,
      type: me.type,
    });
  }

  @Post('push-testing')
  async pushToken(@Body() data: MessageDto) {
    return await this.firebaseService.pushNotification({
      tokens: data.tokens,
      notification: data.notification,
    });
  }

  @Post('deviceToken')
  @ApiBearerAuth()
  @UseGuards(AccessTokenAuthGuard)
  async addDeviceToken(
    @WhoAmI() me: StudentDocument,
    @Body() data: PushTokenDto,
  ) {
    const { token } = data;
    return this.authService.addDeviceToken(me._id.toString(), token);
  }

  @Delete('deviceToken')
  @ApiBearerAuth()
  @UseGuards(AccessTokenAuthGuard)
  async removeDeviceToken(
    @WhoAmI() me: StudentDocument,
    @Query() data: PushTokenDto,
  ) {
    const { token } = data;
    return this.authService.removeDeviceToken(me._id.toString(), token);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @Get('google-redirect')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(
    @Query('state') state: string,
    @WhoAmI() me: StudentDocument | HttpException,
    @Res() res: Response,
  ) {
    const json: string = Buffer.from(state, 'base64').toString('utf-8');

    const { path }: { path: string } = JSON.parse(json);
    if (me instanceof HttpException) {
      return res.redirect(`${path}?error=${me.message}`);
    }

    const result = await this.authService.loginGoogle(me);
    return res.redirect(
      `${path}?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
    );
  }
}
