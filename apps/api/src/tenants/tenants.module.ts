import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { PublicDealersController } from './public-dealers.controller';
import { TenantsService } from './tenants.service';

@Module({
  controllers: [TenantsController, PublicDealersController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
