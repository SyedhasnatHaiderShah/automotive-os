import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'buyer@autonexa.ae', description: 'User email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email!: string;

  @ApiProperty({ example: 'Pass123!@#$', description: 'User master passcode' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsIn...' })
  accessToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: 'Bearer';

  @ApiProperty({ example: 604800 })
  expiresIn!: number;

  @ApiProperty()
  user!: {
    id: string;
    email: string | null;
    displayName: string;
    isPlatformAdmin: boolean;
    status: string;
    primaryRole: string;
    tenantId?: string;
    tenantSlug?: string;
    redirectUrl: string;
  };
}
