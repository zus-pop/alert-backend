import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';
import { Role } from '../../../shared/schemas';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSystemUserDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  lastName: string;
  password: string;

  @IsString()
  @IsIn(['ADMIN', 'MANAGER', 'STAFF'])
  @IsNotEmpty()
  @ApiProperty()
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
}
