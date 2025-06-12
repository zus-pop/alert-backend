import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard, IAuthModuleOptions } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(
    context: ExecutionContext,
  ): IAuthModuleOptions | undefined {
    const { path } = context.switchToHttp().getRequest<Request>().query;

    const json: string = JSON.stringify({ path });

    const state: string = Buffer.from(json, 'utf-8').toString('base64');

    return {
      state,
    };
  }
}
