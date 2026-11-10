import { ApiProperty } from '@nestjs/swagger';

export class CatalogOptionDto {
  @ApiProperty({ description: 'Make or model UUID' })
  id!: string;

  @ApiProperty({ description: 'Make or model name', example: 'Toyota' })
  name!: string;
}
