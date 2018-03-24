'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _eventemitter = require('eventemitter2');

var _byline = require('byline');

var _byline2 = _interopRequireDefault(_byline);

var _errors = require('./errors');

var _errors2 = _interopRequireDefault(_errors);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DEBUG_SINGLE_LIMIT = 16 * 1024 + 10;
var DEBUG_SUM_LIMIT = 1 * 1024;

var Brain = function (_EventEmitter) {
  (0, _inherits3.default)(Brain, _EventEmitter);

  function Brain(id, options) {
    (0, _classCallCheck3.default)(this, Brain);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Brain.__proto__ || (0, _getPrototypeOf2.default)(Brain)).call(this));

    _this.id = id;
    _this.processExited = false;
    _this.debugLogQuotaUsed = 0;
    _this.ignoreAllEvents = false;

    _this.maxTime = options.maxTime;
    _this.usedTime = 0;

    _this.process = _utils2.default.spawnSandbox(options.bin, [], options.sandbox, {
      affinity: options.affinity,
      maxMemory: options.maxMemory
    });
    _this.process.stdout.setEncoding('utf8');
    _this.process.on('error', _this.handleProcessError.bind(_this));
    _this.process.on('exit', _this.handleProcessExit.bind(_this));
    _this.process.stdin.on('error', _this.handleProcessError.bind(_this));
    _this.process.stdout.on('error', _this.handleProcessError.bind(_this));

    _this.allowStdout = false;
    _this.stdout = (0, _byline2.default)(_this.process.stdout);
    _this.stdout.on('data', _this.handleStdoutLine.bind(_this));
    return _this;
  }

  (0, _createClass3.default)(Brain, [{
    key: 'kill',
    value: function kill() {
      if (this.processExited) {
        return;
      }
      _utils2.default.terminateProcess(this.process);
      this.processExited = true;
    }
  }, {
    key: 'handleProcessError',
    value: function handleProcessError(err) {
      if (this.processExited || this.ignoreAllEvents) {
        return;
      }
      this.emit('error', new _errors2.default.BrainError(this.id, 'Brain process error: ' + err.message));
    }
  }, {
    key: 'handleProcessExit',
    value: function handleProcessExit(exitCode) {
      if (this.processExited || this.ignoreAllEvents) {
        return;
      }
      this.emit('exit', exitCode);
    }
  }, {
    key: 'handleStdoutLine',
    value: function handleStdoutLine(line) {
      if (this.processExited || this.ignoreAllEvents) {
        return;
      }
      if (line.length > DEBUG_SINGLE_LIMIT) {
        line = line.substr(0, DEBUG_SINGLE_LIMIT);
      }
      if (line.indexOf('DEBUG') === 0) {
        if (this.debugLogQuotaUsed > DEBUG_SUM_LIMIT) {
          return;
        }
        var message = line.substr(6);
        this.debugLogQuotaUsed += message.length;
        _utils2.default.log('debug', { type: 'brainDebug', id: this.id, message: message, lastElapsed: this.usedTime, quotaUsed: this.debugLogQuotaUsed });
        return;
      }
      _utils2.default.log('debug', { action: 'receiveResponse', id: this.id, data: line, lastElapsed: this.usedTime });
      if (!this.allowStdout) {
        this.emit('error', new _errors2.default.BrainError(this.id, 'Not allowed to respond, but received "' + line + '".'));
        return;
      }
      this.emit('response', line);
    }
  }, {
    key: 'writeInstruction',
    value: function writeInstruction(line) {
      _utils2.default.log('debug', { action: 'sendRequest', id: this.id, data: line, lastElapsed: this.usedTime });
      this.process.stdin.write(line + '\n');
    }
  }, {
    key: 'emitErrorOnException',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(func) {
        var _len,
            args,
            _key,
            err,
            _args = arguments;

        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;

                for (_len = _args.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                  args[_key - 1] = _args[_key];
                }

                _context.next = 4;
                return func(args);

              case 4:
                _context.next = 14;
                break;

              case 6:
                _context.prev = 6;
                _context.t0 = _context['catch'](0);

                if (_context.t0 instanceof _errors2.default.UserError) {
                  _context.next = 10;
                  break;
                }

                throw _context.t0;

              case 10:
                err = _context.t0;

                if (_context.t0 instanceof _errors2.default.UserError) {
                  if (!(_context.t0 instanceof _errors2.default.BrainError)) {
                    err = new _errors2.default.BrainError(this.id, _context.t0.message);
                  }
                }
                this.emit('error', err);
                throw err;

              case 14:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[0, 6]]);
      }));

      function emitErrorOnException(_x) {
        return _ref.apply(this, arguments);
      }

      return emitErrorOnException;
    }()
  }, {
    key: 'waitForOneResponse',
    value: function waitForOneResponse() {
      var _this2 = this;

      var timeout = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var afterThis = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};

      var p = new _promise2.default(function (resolve, reject) {
        _this2.process.stdout.pause();
        _this2.allowStdout = true;

        afterThis();
        var beginTime = Date.now();

        _this2.once('response', function (data) {
          var endTime = Date.now();
          if (endTime - beginTime > 0) {
            _this2.usedTime += endTime - beginTime;
          }
          if (_this2.usedTime > _this2.maxTime) {
            reject(new _errors2.default.BrainError(_this2.id, 'Round timeout. Total elapsed time ' + _this2.usedTime + 'ms exceeded the round time limit ' + _this2.maxTime + 'ms.'));
            return;
          }
          _this2.allowStdout = false;
          resolve(data);
        });
        _this2.process.stdout.resume();
      });
      if (timeout > 0) {
        p = p.timeout(timeout).catch(_promise2.default.TimeoutError, function (e) {
          throw new _errors2.default.BrainError(_this2.id, 'Response timeout. Expect a response within ' + timeout + 'ms.');
        });
      }
      return p;
    }
  }]);
  return Brain;
}(_eventemitter.EventEmitter2);

exports.default = Brain;
//# sourceMappingURL=brain.js.map
