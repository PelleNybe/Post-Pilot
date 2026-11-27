const Module = require('module');
const origLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (
    request === 'canvas' &&
    parent &&
    typeof parent.filename === 'string' &&
    parent.filename.includes('jsdom')
  ) {
    return {};
  }
  return origLoad.apply(this, arguments);
};

module.exports = require('jest-environment-jsdom');
