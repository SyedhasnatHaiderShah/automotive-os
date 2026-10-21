import { ApiProperty } from '@nestjs/swagger';

export class BuyerProfileResponseDto {
  @ApiProperty({ description: 'Buyer user ID', example: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' })
  userId!: string;

  @ApiProperty({ description: 'Preferred language', example: 'en' })
  preferredLanguage!: string;

  @ApiProperty({ description: 'Preferred UAE emirate', example: 'Dubai', nullable: true })
  preferredEmirate!: string | null;

  @ApiProperty({ description: 'Minimum budget in fils', example: '20000000', nullable: true })
  budgetMinFils!: string | null;

  @ApiProperty({ description: 'Maximum budget in fils', example: '40000000', nullable: true })
  budgetMaxFils!: string | null;

  @ApiProperty({ description: 'Preferred makes', example: ['Toyota', 'Porsche'] })
  preferredMakes!: string[];

  @ApiProperty({ description: 'Marketing consent timestamp', nullable: true })
  marketingConsentAt!: string | null;
}

export class MembershipSummaryDto {
  @ApiProperty({ description: 'Dealership tenant ID' })
  tenantId!: string;

  @ApiProperty({ description: 'Dealership slug' })
  tenantSlug!: string;

  @ApiProperty({ description: 'Dealership display name' })
  tenantName!: string;

  @ApiProperty({ description: 'Dealership status' })
  tenantStatus!: string;

  @ApiProperty({ description: 'Role within dealership' })
  role!: string;

  @ApiProperty({ description: 'Active membership flag' })
  active!: boolean;
}

export class MeResponseDto {
  @ApiProperty({ description: 'Global user ID' })
  id!: string;

  @ApiProperty({ description: 'External OIDC subject identifier' })
  identitySubject!: string;

  @ApiProperty({ description: 'Email address', nullable: true })
  email!: string | null;

  @ApiProperty({ description: 'E.164 phone number', nullable: true })
  phoneE164!: string | null;

  @ApiProperty({ description: 'Display name' })
  displayName!: string;

  @ApiProperty({ description: 'Platform administration privilege flag' })
  isPlatformAdmin!: boolean;

  @ApiProperty({ description: 'Buyer profile details', type: BuyerProfileResponseDto, nullable: true })
  buyerProfile!: BuyerProfileResponseDto | null;

  @ApiProperty({ description: 'Active dealership memberships', type: [MembershipSummaryDto] })
  memberships!: MembershipSummaryDto[];
}
