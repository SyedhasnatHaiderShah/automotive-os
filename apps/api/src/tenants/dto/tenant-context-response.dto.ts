import { ApiProperty } from '@nestjs/swagger';

export class BranchSummaryDto {
  @ApiProperty({ description: 'Branch ID' })
  id!: string;

  @ApiProperty({ description: 'Branch name', example: 'Sheikh Zayed Road Flagship' })
  name!: string;

  @ApiProperty({ description: 'Emirate', example: 'Dubai' })
  emirate!: string;

  @ApiProperty({ description: 'City', example: 'Dubai' })
  city!: string;

  @ApiProperty({ description: 'Physical address', nullable: true })
  address!: string | null;
}

export class TenantVerificationSummaryDto {
  @ApiProperty({ description: 'Dealer verification status', example: 'APPROVED' })
  status!: string;

  @ApiProperty({ description: 'Trade licence reference', nullable: true })
  tradeLicenseRef!: string | null;

  @ApiProperty({ description: 'Trade licence expiry date in UTC', nullable: true })
  licenseExpiry!: string | null;

  @ApiProperty({ description: 'Licensing jurisdiction', nullable: true })
  jurisdiction!: string | null;
}

export class TenantContextResponseDto {
  @ApiProperty({ description: 'Verified Tenant ID' })
  tenantId!: string;

  @ApiProperty({ description: 'Dealership slug' })
  slug!: string;

  @ApiProperty({ description: 'Dealership legal trade name' })
  legalName!: string;

  @ApiProperty({ description: 'Dealership display name' })
  displayName!: string;

  @ApiProperty({ description: 'Dealership status' })
  status!: string;

  @ApiProperty({ description: 'Dealership country code', example: 'AE' })
  country!: string;

  @ApiProperty({ description: 'Dealership currency code', example: 'AED' })
  currency!: string;

  @ApiProperty({ description: 'Dealer verification', type: TenantVerificationSummaryDto, nullable: true })
  verification!: TenantVerificationSummaryDto | null;

  @ApiProperty({ description: 'Caller assigned role within this dealership' })
  callerRole!: string;

  @ApiProperty({ description: 'Whether request was executed under platform admin override' })
  isPlatformAdminBypass!: boolean;

  @ApiProperty({ description: 'Dealership branches', type: [BranchSummaryDto] })
  branches!: BranchSummaryDto[];
}
