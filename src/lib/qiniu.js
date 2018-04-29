const qiniu = require('qiniu');
const moment = require('moment');

class Qn {
  constructor(conf) {
    this.accessKey = conf.accessKey;
    this.secretKey = conf.secretKey;
    this.bucket = conf.bucket;
    this.bucketDomain = conf.bucketDomain;

    this.config = new qiniu.conf.Config();
    this.config.zone = qiniu.zone.Zone_z0;

    this.mac = new qiniu.auth.digest.Mac(this.accessKey, this.secretKey);
    const options = {
      scope: this.bucket,
    };
    const putPolicy = new qiniu.rs.PutPolicy(options);
    this.uploadToken = putPolicy.uploadToken(this.mac);
    this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);
  }

  uploadFile(readableStream, key) {
    key = key || moment().format('YYYYMMDDHHmmssSSS');
    const formUploader = new qiniu.form_up.FormUploader(this.config);
    const putExtra = new qiniu.form_up.PutExtra();

    return new Promise((resolve, reject) => {
      formUploader.putStream(this.uploadToken, key, readableStream, putExtra, (respErr, respBody, respInfo) => {
        if (respErr) {
          return reject(respErr);
        }

        return resolve(respInfo);

        // if (respInfo.statusCode == 200) {
        //   console.log(respBody);
        // } else {
        //   console.log(respInfo.statusCode);
        //   console.log(respBody);
        // }
      });
    });
  }

  uploadLocalFile(localFile, key) {
    key = key || moment().format('YYYYMMDDHHmmssSSS');
    const formUploader = new qiniu.form_up.FormUploader(this.config);
    const putExtra = new qiniu.form_up.PutExtra();

    formUploader.putFile(this.uploadToken, key, localFile, putExtra, function (respErr,
      respBody, respInfo) {
      if (respErr) {
        throw respErr;
      }
      if (respInfo.statusCode == 200) {
        console.log(respBody);
      } else {
        console.log(respInfo.statusCode);
        console.log(respBody);
      }
    });
  }

  uploadStreamFile(readableStream, key) {
    key = key || moment().format('YYYYMMDDHHmmssSSS');
    const formUploader = new qiniu.form_up.FormUploader(this.config);
    const putExtra = new qiniu.form_up.PutExtra();

    return new Promise((resolve, reject) => {
      formUploader.putStream(this.uploadToken, key, readableStream, putExtra, function(respErr,
        respBody, respInfo) {
        if (respErr) {
          return reject(respErr);
        }

        return resolve({respInfo, respBody});
        // if (respInfo.statusCode == 200) {
        //   console.log(respBody);
        // } else {
        //   console.log(respInfo.statusCode);
        //   console.log(respBody);
        // }
      });
    });
  }

  getDownloadUrl(key) {
    return this.bucketManager.publicDownloadUrl(this.bucketDomain, key);
  }
}

module.exports = Qn;
