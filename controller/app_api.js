'use strict';
const async = require('async');
const formstream = require('formstream');
const formidable = require('formidable');
const log = require('../common/log');
const utils = require('../common/utils');
const cluster = require('../model/cluster');

const callremote = utils.callremote;
/**
 * @api {get} /api/apps
 * @param req
 * @param callback
 */
exports.listApps = function (req, callback) {
  let clusterCode = req.query.clusterCode;
  log.info(req.session.user);
  if (!req.session.user.role && !req.session.user.clusterAcl[clusterCode]) {
    return callback({
      code: 'ERROR',
      message: 'Cluster unauthorizied'
    });
  }
  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    return callback(opt);
  }
  let path = '/api/apps';
  callremote(path, opt, function (err, result) {
    if (err || result.code !== 'SUCCESS') {
      let errMsg = err && err.message || result.message;
      log.error('get apps from servers failed: ', errMsg);
      let code = (err && err.code) || (result && result.code) || 'ERROR';
      return callback({
        code: code,
        message: errMsg
      });
    } else {
      let ips = [];
      let apps = [];
      result.data.success.forEach((item) => {
        ips.push(item.ip);
        apps = apps.concat(item.apps);
      });

      // app filter
      if (!req.session.user.role && !req.session.user.clusterAcl[clusterCode].isAdmin) {
        let appAcl = req.session.user.clusterAcl[clusterCode].apps;
        if (!appAcl || appAcl.length === 0) {
          apps = [];
        } else {
          apps = apps.filter((app) => {
            for (let i = 0; i < appAcl.length; i++) {
              if (app.name === appAcl[i] || appAcl[i] === '*')
                return true;
            }
            return false;
          });
        }
      }

      return callback(null, {
        success: utils.mergeAppInfo(ips, apps),
        error: result.data.error
      });
    }
  });
};

/**
 * @api {post} /api/delete/:appid
 * @param req
 * @param callback
 */
exports.deleteApp = function (req, callback) {
  let appid = req.params && req.params.appid;
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: 'DELETE_APP',
    opType: 'PAGE_MODEL',
    opLogLevel: 'RISKY', // HIGH_RISK / RISKY / LIMIT / NORMAL http://twiki.corp.taobao.com/bin/view/SRE/Taobao_Security/DataSecPolicy
    opItem: 'APP',
    opItemId: appid
  });
  let clusterCode = req.body.clusterCode;
  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    return callback(opt);
  }
  let path = `/api/delete/${appid}`;
  opt.method = 'POST';
  callremote(path, opt, function (err, results) {
    if (err || results.code !== 'SUCCESS') {
      let errMsg = err && err.message || results.message;
      log.error(`delete app ${appid} failed: `, errMsg);
      let code = (err && err.code) || (results && results.code) || 'ERROR';
      return callback({
        code: code,
        message: errMsg
      });
    } else {
      log.debug(`delete app ${appid} results:`, results);
      return callback(null, results.data);
    }
  });
};

/**
 * @api {post} /api/restart/:appid
 */
exports.restartApp = function (req, callback) {
  let appid = req.params && req.params.appid;
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: 'RESTART_APP',
    opType: 'PAGE_MODEL',
    opLogLevel: 'LIMIT',
    opItem: 'APP',
    opItemId: appid
  });
  let clusterCode = req.body.clusterCode;
  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    return callback(opt);
  }
  let path = `/api/restart/${appid}`;
  opt.method = 'POST';
  opt.timeout = 30000;
  callremote(path, opt, function (err, results) {
    if (err || results.code !== 'SUCCESS') {
      let errMsg = err && err.message || results.message;
      log.error(`restart app ${appid} failed: `, errMsg);
      let code = (err && err.code) || (results && results.code) || 'ERROR';
      return callback({
        code: code,
        message: errMsg
      });
    } else {
      log.debug(`restart app ${appid} results:`, results);
      return callback(null, results.data);
    }
  });
};

/**
 * @api {post} /api/reload/:appid
 * @param req
 * @param callback
 */
exports.reloadApp = function (req, callback) {
  let appid = req.params && req.params.appid;
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: 'RELOAD_APP',
    opType: 'PAGE_MODEL',
    opLogLevel: 'LIMIT',
    opItem: 'APP',
    opItemId: appid
  });
  let clusterCode = req.body.clusterCode;
  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    return callback(opt);
  }
  let path = `/api/reload/${appid}`;
  opt.method = 'POST';
  opt.timeout = 60000;
  callremote(path, opt, function (err, results) {
    if (err || results.code !== 'SUCCESS') {
      let errMsg = err && err.message || results.message;
      log.error(`reload app ${appid} failed: `, errMsg);
      let code = (err && err.code) || (results && results.code) || 'ERROR';
      return callback({
        code: code,
        message: errMsg
      });
    } else {
      log.debug(`reload app ${appid} results:`, results);
      return callback(null, results.data);
    }
  });
};

/**
 * @api {post} /api/start/:appid
 * @param req
 * @param callback
 */
exports.startApp = function (req, callback) {
  let appid = req.params && req.params.appid;
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: 'START_APP',
    opType: 'PAGE_MODEL',
    opLogLevel: 'LIMIT',
    opItem: 'APP',
    opItemId: appid
  });
  let clusterCode = req.body.clusterCode;
  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    return callback(opt);
  }
  let path = `/api/start/${appid}`;
  opt.method = 'POST';
  callremote(path, opt, function (err, results) {
    if (err || results.code !== 'SUCCESS') {
      let errMsg = err && err.message || results.message;
      log.error(`start app ${appid} failed: `, errMsg);
      let code = (err && err.code) || (results && results.code) || 'ERROR';
      return callback({
        code: code,
        message: errMsg
      });
    } else {
      log.debug(`start app ${appid} results:`, results);
      return callback(null, results.data);
    }
  });
};

/**
 * @api {post} /api/stop/:appid
 * @param req
 * @param callback
 */
exports.stopApp = function (req, callback) {
  let appid = req.params && req.params.appid;
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: 'STOP_APP',
    opType: 'PAGE_MODEL',
    opLogLevel: 'RISKY',
    opItem: 'APP',
    opItemId: appid
  });
  let clusterCode = req.body.clusterCode;
  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    return callback(opt);
  }
  let path = `/api/stop/${appid}`;
  opt.method = 'POST';
  opt.timeout = 30000;
  callremote(path, opt, function (err, results) {
    if (err || results.code !== 'SUCCESS') {
      let errMsg = err && err.message || results.message;
      log.error(`stop app ${appid} failed: `, errMsg);
      let code = (err && err.code) || (results && results.code) || 'ERROR';
      return callback({
        code: code,
        message: errMsg
      });
    } else {
      log.debug(`stop app ${appid} results:`, results);
      return callback(null, results.data);
    }
  });
};

/**
 * @api {post} /api/publish
 * @param req
 * @param callback
 */
exports.publish = function (req, callback) {
  let clusterCode = req.query.clusterCode;
  async.waterfall([
    function (cb) {
      let form = new formidable.IncomingForm();
      form.parse(req, function (err, fields, files) {
        req.oplog({
          clientId: req.ips.join('') || '-',
          opName: 'PUBLISH_APP',
          opType: 'PAGE_MODEL',
          opLogLevel: 'NORMAL',
          opItem: 'APP',
          opItemId: files && files.pkg && files.pkg.name || 'UNKNOW_FILE_NAME'
        });
        if (err) {
          err.code = 'ERROR_UPLOAD_APP_PACKAGE_FAILED';
          return cb(err);
        }
        if (!files || !Object.keys(files).length) {
          let err = new Error('app package empty');
          err.code = 'ERROR_APP_PACKAGE_EMPTY';
          return cb(err);
        }
        cb(null, files.pkg);
      });
    },
    function (file, cb) {
      let opt = cluster.getClusterCfgByCode(clusterCode);
      if (opt.code === 'ERROR') {
        return cb(opt);
      }
      log.info(`publish "${file.name}" to server: ${opt.endpoint}`);
      let form = formstream();
      form.file('pkg', file.path, file.name);
      let path = '/api/publish';
      opt.method = 'POST';
      opt.headers = form.headers();
      opt.stream = form;
      opt.timeout = 120000;
      callremote(path, opt, cb);
    }
  ], function (err, results) {
    if (err || results.code !== 'SUCCESS') {
      let errMsg = err && err.message || results.message;
      log.error('publish app failed:', errMsg);
      let code = (err && err.code) || (results && results.code) || 'ERROR';
      return callback({
        code: code,
        message: errMsg
      });
    } else {
      return callback(null, results.data);
    }
  });
};

/**
 * @api {DELETE} /api/clean_exit_record/:appid
 * @param req
 * @param callback
 */
exports.cleanAppExitRecord = function (req, callback) {
  let appid = req.params && req.params.appid;
  req.oplog({
    clientId: req.ips.join('') || '-',
    opName: 'CLEAN_APP_EXIT_RECORD',
    opType: 'PAGE_MODEL',
    opLogLevel: 'NORMAL',
    opItem: 'APP',
    opItemId: appid
  });
  let clusterCode = req.body.clusterCode;
  let opt = cluster.getClusterCfgByCode(clusterCode);
  if (opt.code === 'ERROR') {
    return callback(opt);
  }
  if (['__PROXY___0.0.0_0', '__ADMIN___0.0.0_0'].indexOf(appid) >= 0) {
    appid = appid.substring(0, appid.length - 8);
  }
  let path = `/api/clean_exit_record/${appid}`;
  opt.method = 'DELETE';
  callremote(path, opt, function (err, results) {
    if (err || results.code !== 'SUCCESS') {
      let errMsg = err && err.message || results.message;
      log.error(`clean appExitRecord of ${appid} failed: `, errMsg);
      let code = (err && err.code) || (results && results.code) || 'ERROR';
      return callback({
        code: code,
        message: errMsg
      });
    } else {
      log.debug('clean appExitRecord results:', results);
      return callback(null, results.data);
    }
  });
};
