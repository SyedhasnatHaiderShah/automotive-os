import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { MembershipRole } from '@automotive-os/database';

export class AdminCreateDealerDto {
  @ApiProperty({ example: 'al-futtaim-motors', description: 'URL-safe dealership slug' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must contain only lowercase alphanumeric characters and hyphens' })
  slug!: string;

  @ApiProperty({ example: 'Al-Futtaim Automotive LLC', description: 'Official legal registered entity name' })
  @IsString()
  @IsNotEmpty()
  legalName!: string;

  @ApiProperty({ example: 'Al-Futtaim Motors Dubai', description: 'Customer-facing dealership name' })
  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @ApiProperty({ example: 'principal@al-futtaim.ae', description: 'Initial dealer principal / administrator email' })
  @IsEmail()
  adminEmail!: string;

  @ApiProperty({ example: 'Tariq Al Futtaim', description: 'Dealer principal contact name' })
  @IsString()
  @IsNotEmpty()
  adminName!: string;

  @ApiPropertyOptional({ example: 'AED', default: 'AED' })
  @IsOptional()
  @IsString()
  currency?: string = 'AED';
}

export class AdminInviteDealerStaffDto {
  @ApiProperty({ example: 'agent@dealership.ae' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: MembershipRole, example: 'SALES_AGENT' })
  @IsEnum(MembershipRole)
  role!: MembershipRole;

  @ApiPropertyOptional({ example: 'Agent Name' })
  @IsOptional()
  @IsString()
  name?: string;
}
