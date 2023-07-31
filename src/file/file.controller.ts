import { Controller, Post, Req, Res } from '@nestjs/common';
import { FileService } from './file.service';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}
  @Post('/')
  async createPost(@Req() req, @Res() res) {
    try {
      await this.fileService.fileupload(req, res);
    } catch (error) {
      console.error(error);
      return req
        .status(500)
        .json(`Failed to upload image file: ${error.message}`);
    }
  }

  @Post('send')
  async sendEmail() {
    return this.fileService.sendEmail();
  }
}
