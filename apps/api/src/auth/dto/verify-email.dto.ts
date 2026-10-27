import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ description: 'Cryptographic email verification token' })
  @IsString()
  @IsNotEmpty({ message: 'Verification token is required' })
  token!: string;
}

export class VerifyEmailResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Email verified successfully. You may now log in.' })
  message!: string;

  @ApiProperty({ example: 'buyer@autonexa.ae' })
  email?: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'buyer@autonexa.ae', description: 'Customer email' })
  @IsEmail({}, { message: 'A valid email address is required' })
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email!: string;
}

export class ResendVerificationResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({
    example: 'If an unverified account exists for this email, a verification link has been sent.',
  })
  message!: string;

  @ApiProperty({ required: false })
  verificationToken?: string; // Included only in test/dev environments
}
