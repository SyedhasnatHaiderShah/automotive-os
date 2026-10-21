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

  @ApiProperty({ description: 'Caller assigned role within this dealership' })
  callerRole!: string;

  @ApiProperty({ description: 'Whether request was executed under platform admin override' })
  isPlatformAdminBypass!: boolean;

  @ApiProperty({ description: 'Dealership branches', type: [BranchSummaryDto] })
  branches!: BranchSummaryDto[];
}
