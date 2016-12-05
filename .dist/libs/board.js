'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _errors = require('./errors');

var _errors2 = _interopRequireDefault(_errors);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var derives = [[0, 1], [1, 0], [1, 1], [1, -1]];

var STATE_GOING = 0;
var STATE_WIN = 1;
var STATE_DRAW = 2;

var Board = function () {
  (0, _createClass3.default)(Board, null, [{
    key: 'translateField',
    value: function translateField(fieldText) {
      (0, _assert2.default)(fieldText === 'black' || fieldText === 'white');
      if (fieldText === 'black') {
        return Board.FIELD_BLACK;
      } else if (fieldText === 'white') {
        return Board.FIELD_WHITE;
      }
    }
  }, {
    key: 'getOppositeField',
    value: function getOppositeField(field) {
      (0, _assert2.default)(field === Board.FIELD_BLACK || field === Board.FIELD_WHITE);
      if (field === Board.FIELD_BLACK) {
        return Board.FIELD_WHITE;
      } else if (field === Board.FIELD_WHITE) {
        return Board.FIELD_BLACK;
      }
    }
  }]);

  function Board(width, height, nInRow) {
    (0, _classCallCheck3.default)(this, Board);

    (0, _assert2.default)(width > 0);
    (0, _assert2.default)(height > 0);
    (0, _assert2.default)(nInRow > 1);
    _utils2.default.log('debug', { action: 'createBoard', width: width, height: height, nInRow: nInRow });
    this.width = width;
    this.height = height;
    this.nInRow = nInRow;
    this.clear();
  }

  (0, _createClass3.default)(Board, [{
    key: 'clear',
    value: function clear() {
      var _this = this;

      this.board = _lodash2.default.map(new Array(this.height), function (row) {
        return _lodash2.default.fill(new Array(_this.width), Board.FIELD_BLANK);
      });
      this.order = _lodash2.default.map(new Array(this.height), function (row) {
        return _lodash2.default.fill(new Array(_this.width), 0);
      });
      this.currentOrder = 0;
      this.nextField = Board.FIELD_BLACK;
      this.state = Board.BOARD_STATE_GOING;
    }
  }, {
    key: 'clearFromFile',
    value: function clearFromFile(file) {
      var _fieldStat,
          _this2 = this;

      this.clear();
      var places = void 0;
      try {
        places = JSON.parse(_fs2.default.readFileSync(file).toString());
      } catch (e) {
        throw new _errors2.default.UserError('Failed to read or parse the file.');
      }
      var fieldStat = (_fieldStat = {}, (0, _defineProperty3.default)(_fieldStat, Board.FIELD_BLACK, 0), (0, _defineProperty3.default)(_fieldStat, Board.FIELD_WHITE, 0), _fieldStat);
      places.forEach(function (place) {
        var _place = (0, _slicedToArray3.default)(place, 3),
            x = _place[0],
            y = _place[1],
            field = _place[2];

        if (x < 0 || x >= _this2.width || y < 0 || y >= _this2.height) {
          throw new _errors2.default.UserError('Invalid place at (' + x + ', ' + y + ')');
        }
        if (field !== Board.FIELD_BLACK && field !== Board.FIELD_WHITE) {
          throw new _errors2.default.UserError('Invalid field value ' + field);
        }
        if (_this2.board[y][x] !== Board.FIELD_BLANK) {
          throw new _errors2.default.UserError('Duplicate place at (' + x + ', ' + y + ')');
        }
        _this2.board[y][x] = field;
        fieldStat[field]++;
      });
      if (fieldStat[Board.FIELD_BLACK] === fieldStat[Board.FIELD_WHITE]) {
        this.nextField = Board.FIELD_BLACK;
      } else if (fieldStat[Board.FIELD_BLACK] === fieldStat[Board.FIELD_WHITE] + 1) {
        this.nextField = Board.FIELD_WHITE;
      } else {
        throw new _errors2.default.UserError('Invalid initial state, black = ' + fieldStat[Board.FIELD_BLACK] + ', white = ' + fieldStat[Board.FIELD_WHITE] + '.');
      }
      _utils2.default.log('debug', { action: 'clearBoard', board: this.board, nextField: this.nextField });
    }
  }, {
    key: 'getCurrentPlaces',
    value: function getCurrentPlaces() {
      var places = [];
      this.board.forEach(function (row, y) {
        row.forEach(function (field, x) {
          if (field !== Board.FIELD_BLANK) {
            places.push({ x: x, y: y, field: field });
          }
        });
      });
      return places;
    }
  }, {
    key: 'place',
    value: function place(x, y) {
      (0, _assert2.default)(this.state === Board.BOARD_STATE_GOING);

      if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
        throw new _errors2.default.UserError('Invalid move. Movement position out of board.');
      }
      if (this.board[y][x] !== Board.FIELD_BLANK) {
        throw new _errors2.default.UserError('Invalid move. There is already a stone at position (' + x + ', ' + y + ').');
      }

      var field = this.nextField;
      this.board[y][x] = field;
      this.order[y][x] = ++this.currentOrder;
      this.nextField = Board.getOppositeField(field);

      _utils2.default.log('debug', { action: 'place', position: [x, y], field: field });

      var move = { x: x, y: y, ended: false };

      var _getCurrentState = this.getCurrentState(x, y, field),
          _getCurrentState2 = (0, _slicedToArray3.default)(_getCurrentState, 2),
          state = _getCurrentState2[0],
          winningStones = _getCurrentState2[1];

      if (state === STATE_WIN || state === STATE_DRAW) {
        move.ended = true;
        if (state === STATE_DRAW) {
          this.state = Board.BOARD_STATE_DRAW;
        } else {
          if (field === Board.FIELD_BLACK) {
            this.state = Board.BOARD_STATE_WIN_BLACK;
          } else {
            this.state = Board.BOARD_STATE_WIN_WHITE;
          }
        }
      }

      if (move.ended) {
        var info = { action: 'roundEnd', board: this.board };
        if (state === STATE_WIN) {
          info.winningStones = winningStones;
        }
        _utils2.default.log('debug', info);
      }

      return move;
    }
  }, {
    key: 'getCurrentState',
    value: function getCurrentState(x, y, field) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)(derives), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _step$value = (0, _slicedToArray3.default)(_step.value, 2),
              dx = _step$value[0],
              dy = _step$value[1];

          var count = 1;
          var x0 = void 0,
              y0 = void 0;
          var stones = [[x, y]];
          var _arr = [1, -1];
          for (var _i = 0; _i < _arr.length; _i++) {
            var dir = _arr[_i];
            x0 = x + dir * dx;
            y0 = y + dir * dy;
            while (x0 >= 0 && x0 < this.width && y0 >= 0 && y0 < this.height && this.board[y0][x0] === field) {
              count++;
              stones.push([x0, y0]);
              x0 += dir * dx;
              y0 += dir * dy;
            }
          }
          if (count >= this.nInRow) {
            return [STATE_WIN, stones];
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = (0, _getIterator3.default)(this.board), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var row = _step2.value;
          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = (0, _getIterator3.default)(row), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var _field = _step3.value;

              if (_field === Board.FIELD_BLANK) {
                return [STATE_GOING];
              }
            }
          } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
              }
            } finally {
              if (_didIteratorError3) {
                throw _iteratorError3;
              }
            }
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return [STATE_DRAW];
    }
  }]);
  return Board;
}();

Board.FIELD_BLANK = 0;
Board.FIELD_BLACK = 1;
Board.FIELD_WHITE = 2;
Board.BOARD_STATE_GOING = 0;
Board.BOARD_STATE_WIN_BLACK = 1;
Board.BOARD_STATE_WIN_WHITE = 2;
Board.BOARD_STATE_DRAW = 3;
exports.default = Board;
//# sourceMappingURL=board.js.map
