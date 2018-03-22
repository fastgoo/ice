// 读取需要编译的文件
'use strict';
const fs = require('fs');
const colors = require('chalk');
const path = require('path');

const walk = function walk(dir) {
  var results = [];
  var list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    var stat = fs.statSync(file);
    if (stat && stat.isDirectory()) results = results.concat(walk(file));
    else results.push(file);
  });
  return results;
};

/**
 * 获取项目中符合 src/pages/xxxx/index.jsx 的文件
 *
 * @return {Object}           entry 的 kv 对象
 */

module.exports = function getEntry(cwd) {
  var entryObj = {};
  const appDirectory = fs.realpathSync(cwd);
  const packageFilePath = path.resolve(appDirectory, 'package.json');
  const packageData = require(packageFilePath);

  // 需要区分项目类型，新版的项目直接返回 src/index.js
  if (packageData) {
    let entry;

    // 兼容 iceworks 旧项目 package.json 里的 ice 字段。
    if (packageData.ice && packageData.ice.entry) {
      entry = packageData.ice.entry;
    }

    if (packageData.buildConfig && packageData.buildConfig.entry) {
      entry = packageData.buildConfig.entry;
    }

    if (entry) {
      console.log(colors.blue('TIPS:'), 'package.json 存在 entry 配置');
      return entry;
    }
  }

  var entryDir = './src';

  try {
    // 获取当前目录下所有文件
    var files = walk(entryDir);
    files.forEach(function(filePath) {
      var fileExt = path.extname(filePath);
      var fileBasename = path.basename(filePath, fileExt);
      var pageFile = path.relative(entryDir, filePath);

      var pageDirTree = pageFile.split(path.sep);

      if (
        (fileExt === '.jsx' ||
          fileExt === '.js' ||
          fileExt === '.tsx' ||
          fileExt === '.ts') &&
        fileBasename === 'index' &&
        pageDirTree.length === 3 &&
        pageDirTree[0] === 'pages'
      ) {
        pageDirTree.pop();
        pageDirTree.push('index');
        var pageName = pageDirTree.join('/');

        entryObj[pageName] = filePath;
      }
    });
    return entryObj;
  } catch (err) {
    throw err;
  }
};
