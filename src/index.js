const http = require('http');
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const _ = require('lodash');
const fs = require('fs');
const moment = require('moment');

const Qn = require('./lib/qiniu');

const upload = multer({
  dest: 'files/'
});

class App {
  constructor(conf) {
    this.conf = conf;
    this.qn = new Qn(conf);
    this.app = express();
    this.initAPI();
  }

  getFileName(file) {
    let filename = file.originalname;
    const idx = file.originalname.indexOf('.');
    if (-1 !== idx) {
      const ext = file.originalname.substring(idx);
      filename = moment().format('YYYYMMDDHHmmssSSS') + ext;
    }

    return filename;
  }

  initAPI() {
    // cors
    this.app.use(cors());

    // upload file api
    this.app.post('/upload', upload.single('file'), async (req, res, next) => {
      if (req.file) {
        try {
          const fileInfo = req.file;
          const readableStream = fs.createReadStream(fileInfo.path);
          const result = await this.qn.uploadStreamFile(readableStream, this.getFileName(fileInfo));
          const statusCode = _.get(result, 'respInfo.statusCode');
          const respKey = _.get(result, 'respBody.key');

          if (200 === statusCode) {
            res.json({
              msg: 'ok!',
              downloadUrl: respKey
            });
            res.end();
          } else {
            res.setHeader(result.respInfo.headers);
            res.json(result);
            res.end();
          }

          // remove the file from server
          fs.unlinkSync(req.file.path);
        } catch (error) {
          console.log(error);
          res.json({
            msg: 'error occured!',
            error
          });
          res.end();
        }

      } else {
        res.json({
          msg: 'error occured!',
          error: new Error('file not found!')
        });
        res.end();
      }
    });

    // download file api
    this.app.get('/file/:key', (req, res) => {
      try {
        const downloadUrl = this.qn.getDownloadUrl(req.params.key);
        http.get(downloadUrl, (qnRes) => {
          res.writeHead(qnRes.statusCode, qnRes.headers);

          qnRes.on('data', chunk => {
            res.write(chunk);
          });

          qnRes.on('end', () => {
            res.end();
          });

          qnRes.on('error', err => {
            res.sendStatus(400);
            res.json({
              msg: 'error occured!',
              error: err
            });
            res.end();
          });
        });
      } catch (error) {
        res.json({
          msg: 'error occured!',
          error
        });
        res.end();
      }
    });
  }

  run() {
    const port = _.get(this.conf, 'port', 3000);
    this.app.listen(3000, () => {
      console.log(`app is running on port ${port}...`);
    });
  }
}

module.exports = App;
