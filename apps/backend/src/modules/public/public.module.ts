import { Module } from '@nestjs/common';
import { PublicController, PublicRootController } from './public.controller';

@Module({
  controllers: [PublicRootController, PublicController],
})
export class PublicModule {}
