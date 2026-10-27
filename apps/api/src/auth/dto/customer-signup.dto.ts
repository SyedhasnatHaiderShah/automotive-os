import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Equals, IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CustomerSignupDto {
  @ApiProperty({ example: 'buyer@autonexa.ae', description: 'Customer email' })
  @IsEmail({}, { message: 'A valid email address is required' })
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email!: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'Customer password' })
  @IsString()
  @MinLength(10, { message: 'Password must be at least 10 characters long' })
  password!: string;

  @ApiProperty({ example: 'Sultan Al Qasimi', description: 'Full legal name or display name' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  displayName!: string;

  @ApiPropertyOptional({ example: '+971501234567', description: 'UAE phone number in E.164' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Dubai', description: 'Preferred UAE emirate' })
  @IsOptional()
  @IsString()
  emirate?: string;

  @ApiProperty({
    example: true,
    description: 'Explicit UAE Federal Decree-Law No. 45/2021 (PDPL) consent',
  })
  @IsBoolean()
  @Equals(true, { message: 'Explicit consent under UAE Federal PDPL Law No. 45/2021 is required' })
  consentPdpl!: boolean;
}

export class CustomerSignupResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  userId!: string;

  @ApiProperty({ example: 'buyer@autonexa.ae' })
  email!: string;

  @ApiProperty({ example: 'ACTIVE' })
  status!: string;

  @ApiProperty({ example: 'Account registered successfully.' })
  message!: string;
}
