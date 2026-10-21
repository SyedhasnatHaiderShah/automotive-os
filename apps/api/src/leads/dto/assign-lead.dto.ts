import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AssignLeadDto {
  @ApiProperty({
    description: 'Membership UUID of dealership staff to assign (or null to unassign)',
    example: '10000000-0000-0000-0000-000000000001',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  assignedMembershipId?: string | null;
}
