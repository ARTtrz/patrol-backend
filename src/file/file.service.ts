import { Injectable, Req, Res } from '@nestjs/common';
import * as multer from 'multer';
import * as AWS from 'aws-sdk';
import * as multerS3 from 'multer-s3';

const AWS_S3_BUCKET_NAME = 'otlichnik-kz';
const s3 = new AWS.S3();
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1',
});

const SES = new AWS.SES({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1',
});

@Injectable()
export class FileService {
  upload = multer({
    storage: multerS3({
      s3: s3,

      bucket: AWS_S3_BUCKET_NAME,
      acl: 'public-read',
      ACL: 'public-read',
      key: function (request, file, cb) {
        cb(null, `${Date.now().toString()} - ${file.originalname}`);
      },
      expires: 60,
    }),
  }).array('file', 1);

  async fileupload(@Req() req, @Res() res) {
    try {
      this.upload(req, res, function (error) {
        if (error) {
          console.log(error);
          return res.status(404).json('Блин что то не так');
        }
        return res.status(201).json(req.files[0].location);
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json('Что то не так');
    }
  }

  async sendEmail() {
    const params = {
      Destination: {
        /* required */
        CcAddresses: [
          'artemkim953@gmail.com',
          /* more items */
        ],
        ToAddresses: [
          'artemkim953@gmail.com',
          /* more items */
        ],
      },
      Message: {
        /* required */
        Body: {
          /* required */
          Html: {
            Charset: 'UTF-8',
            Data: 'HTML_FORMAT_BODY',
          },
          Text: {
            Charset: 'UTF-8',
            Data: 'TEXT_FORMAT_BODY',
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'Test email',
        },
      },
      Source: 'artemkim953@gmail.com' /* required */,
      ReplyToAddresses: [
        'artemkim953@gmail.com',
        /* more items */
      ],
    };

    const emailSent = SES.sendEmail(params).promise();

    emailSent
      .then((data) => {
        console.log(data);
      })
      .catch((err) => {
        console.log(err);
      });
  }
}
