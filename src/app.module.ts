import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { FileModule } from './file/file.module';
import { InspectorModule } from './inspector/inspector.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FileModule,
    InspectorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
