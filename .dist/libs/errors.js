'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _es6Error = require('es6-error');

var _es6Error2 = _interopRequireDefault(_es6Error);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var UserError = function (_ExtendableError) {
  (0, _inherits3.default)(UserError, _ExtendableError);

  function UserError() {
    (0, _classCallCheck3.default)(this, UserError);
    return (0, _possibleConstructorReturn3.default)(this, (UserError.__proto__ || (0, _getPrototypeOf2.default)(UserError)).apply(this, arguments));
  }

  return UserError;
}(_es6Error2.default);

var BrainError = function (_UserError) {
  (0, _inherits3.default)(BrainError, _UserError);

  function BrainError(id, message) {
    (0, _classCallCheck3.default)(this, BrainError);

    var _this2 = (0, _possibleConstructorReturn3.default)(this, (BrainError.__proto__ || (0, _getPrototypeOf2.default)(BrainError)).call(this, message));

    _this2.id = id;
    return _this2;
  }

  return BrainError;
}(UserError);

var errors = {
  UserError: UserError,
  BrainError: BrainError
};

exports.default = errors;
//# sourceMappingURL=errors.js.map
