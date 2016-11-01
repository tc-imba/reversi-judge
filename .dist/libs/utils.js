'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var utils = {};

utils.log = function (type, data) {
  console.log((0, _stringify2.default)({ at: Date.now(), type: type, data: data }));
};

utils.spawnSandbox = function (command, args, sandboxBin, sandboxOptions) {
  var spawnCommand = void 0,
      spawnArgs = void 0;
  if (sandboxBin) {
    var _spawnArgs;

    spawnCommand = sandboxBin;
    spawnArgs = [];
    spawnArgs.push('--use-desktop');
    spawnArgs.push('--use-logon');
    spawnArgs.push('--active-process', 1);
    spawnArgs.push('--memory', sandboxOptions.maxMemory);
    if (sandboxOptions.affinity) {
      spawnArgs.push('--affinity', 1 << sandboxOptions.affinity - 1);
    }
    (_spawnArgs = spawnArgs).push.apply(_spawnArgs, [command].concat((0, _toConsumableArray3.default)(args)));
  } else {
    spawnCommand = command;
    spawnArgs = args;
  }
  return _child_process2.default.spawn(spawnCommand, spawnArgs, {
    stdio: 'pipe'
  });
};

utils.terminateProcess = function (child) {
  if (child.stdout) {
    child.stdout.destroy();
  }
  if (child.stderr) {
    child.stderr.destroy();
  }
  try {
    if (process.platform === 'win32') {
      // kill process tree
      _child_process2.default.execSync('taskkill /pid ' + child.pid + ' /T /F');
    } else {
      child.kill('SIGKILL');
    }
  } catch (ignore) {
    // ignore
  }
};

exports.default = utils;
//# sourceMappingURL=utils.js.map
