"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assert = require("assert");

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var exitCode = {};

var exitCodeMin = 33;

exitCode.EXIT_B0_WIN = exitCodeMin + 0;
exitCode.EXIT_B1_WIN = exitCodeMin + 1;
exitCode.EXIT_DRAW = exitCodeMin + 2;
exitCode.EXIT_ERROR = exitCodeMin + 3;

exitCode.getCodeForBrainLose = function (id) {
  if (id === "0") {
    return exitCode.EXIT_B1_WIN;
  } else if (id === "1") {
    return exitCode.EXIT_B0_WIN;
  } else {
    (0, _assert2.default)(false);
  }
};

exitCode.getCodeForBrainWin = function (id) {
  if (id === "0") {
    return exitCode.EXIT_B0_WIN;
  } else if (id === "1") {
    return exitCode.EXIT_B1_WIN;
  } else {
    (0, _assert2.default)(false);
  }
};

exports.default = exitCode;
//# sourceMappingURL=exitCode.js.map
