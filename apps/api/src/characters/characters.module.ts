import { Module } from '@nestjs/common';
import { CharactersController } from './characters.controller';
import { AdminCharactersController } from './admin-characters.controller';
import { CharactersService } from './characters.service';

@Module({
  controllers: [CharactersController, AdminCharactersController],
  providers: [CharactersService],
  exports: [CharactersService],
})
export class CharactersModule {}
