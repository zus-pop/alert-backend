import { AuthGuard } from '@nestjs/passport';

export class RefreshTokenAuthGuard extends AuthGuard('jwt-refresh') {}
