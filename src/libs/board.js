import fs from 'fs';
import assert from 'assert';
import _ from 'lodash';

import errors from './errors';
import utils from './utils';

const derives = [[0, 1], [1, 0], [1, 1], [1, -1]];

const STATE_GOING = -1;
const STATE_BLACK_WIN = 0;
const STATE_WHITE_WIN = 1;
const STATE_FORBIDDEN = 2;
const STATE_DRAW = 3;

export default class Board {

  static FIELD_BLANK = 0;
  static FIELD_BLACK = 1;
  static FIELD_WHITE = 2;

  static BOARD_STATE_GOING = 0;
  static BOARD_STATE_WIN_BLACK = 1;
  static BOARD_STATE_WIN_WHITE = 2;
  static BOARD_STATE_DRAW = 3;

  static translateField(fieldText) {
    assert(fieldText === 'black' || fieldText === 'white');
    if (fieldText === 'black') {
      return Board.FIELD_BLACK;
    } else if (fieldText === 'white') {
      return Board.FIELD_WHITE;
    }
  }

  static getOppositeField(field) {
    assert(field === Board.FIELD_BLACK || field === Board.FIELD_WHITE);
    if (field === Board.FIELD_BLACK) {
      return Board.FIELD_WHITE;
    } else if (field === Board.FIELD_WHITE) {
      return Board.FIELD_BLACK;
    }
  }

  constructor(width, height, nInRow) {
    assert(width > 0);
    assert(height > 0);
    // assert(nInRow > 1);
    utils.log('debug', {action: 'createBoard', width, height, nInRow});
    this.width = width;
    this.height = height;
    // this.nInRow = nInRow;
    this.directions = [
      {x: -1, y: -1},
      {x: -1, y: 0},
      {x: -1, y: 1},
      {x: 0, y: -1},
      {x: 0, y: 1},
      {x: 1, y: -1},
      {x: 1, y: 0},
      {x: 1, y: 1},
    ];
    this.clear();
  }

  clear() {
    this.board = _.map(new Array(this.height),
        row => _.fill(new Array(this.width), Board.FIELD_BLANK));
    this.order = _.map(new Array(this.height),
        row => _.fill(new Array(this.width), 0));
    this.currentOrder = 0;
    this.nextField = Board.FIELD_BLACK;
    this.state = Board.BOARD_STATE_GOING;
    this.lastPass = false;
  }

  clearFromFile(file) {
    this.clear();
    let places;
    try {
      places = JSON.parse(fs.readFileSync(file).toString());
    } catch (e) {
      throw new errors.UserError('Failed to read or parse the file.');
    }
    const fieldStat = {
      [Board.FIELD_BLACK]: 0,
      [Board.FIELD_WHITE]: 0,
    };
    places.forEach(place => {
      const [x, y, field] = place;
      if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
        throw new errors.UserError(`Invalid place at (${x}, ${y})`);
      }
      if (field !== Board.FIELD_BLACK && field !== Board.FIELD_WHITE) {
        throw new errors.UserError(`Invalid field value ${field}`);
      }
      if (this.board[y][x] !== Board.FIELD_BLANK) {
        throw new errors.UserError(`Duplicate place at (${x}, ${y})`);
      }
      this.board[y][x] = field;
      fieldStat[field]++;
    });
    if (fieldStat[Board.FIELD_BLACK] === fieldStat[Board.FIELD_WHITE]) {
      this.nextField = Board.FIELD_BLACK;
    } else if (fieldStat[Board.FIELD_BLACK] === fieldStat[Board.FIELD_WHITE] +
        1) {
      this.nextField = Board.FIELD_WHITE;
    } else {
      throw new errors.UserError(
          `Invalid initial state, black = ${fieldStat[Board.FIELD_BLACK]}, white = ${fieldStat[Board.FIELD_WHITE]}.`);
    }
    utils.log('debug',
        {action: 'clearBoard', board: this.board, nextField: this.nextField});
  }

  getCurrentPlaces() {
    const places = [];
    this.board.forEach((row, y) => {
      row.forEach((field, x) => {
        if (field !== Board.FIELD_BLANK) {
          places.push({x, y, field});
        }
      });
    });
    return places;
  }

  reverse(x, y, dir, field, action = false) {
    if (this.board[y][x] !== Board.FIELD_BLANK) {
      return 0;
    }
    const oppField = Board.getOppositeField(field);
    let flag = false;
    let num = 0;
    x += dir.x;
    y += dir.y;
    while (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      if (this.board[y][x] === oppField) {
        ++num;
        if (action) {
          this.board[y][x] = field;
        }
      } else if (this.board[y][x] === field && num > 0) {
        flag = true;
        break;
      } else break;
      x += dir.x;
      y += dir.y;
    }
    if (!flag) num = 0;
    return num;
  }

  calculateReversePoints(field) {
    this.reverseCount = _.map(new Array(this.height),
        row => _.fill(new Array(this.width), 0));
    let count = 0;
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        let num = 0;
        for (const i in this.directions) {
          num += this.reverse(x, y, this.directions[i], field);
        }
        this.reverseCount[y][x] = num;
        if (num > 0) {
          ++count;
        }
      }
    }
    return count;
  }

  calculateResultState() {
    let blackNum = 0;
    let whiteNum = 0;
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (this.board[y][x] === Board.FIELD_BLACK) {
          ++blackNum;
        } else if (this.board[y][x] === Board.FIELD_WHITE) {
          ++whiteNum;
        }
      }
    }
    if (blackNum === whiteNum) {
      this.state = Board.BOARD_STATE_DRAW;
    } else if (blackNum > whiteNum) {
      this.state = Board.BOARD_STATE_WIN_BLACK;
    } else {
      this.state = Board.BOARD_STATE_WIN_WHITE;
    }
  }

  place(x, y, pass = false) {
    assert(this.state === Board.BOARD_STATE_GOING);

    if (!pass && (x < 0 || x >= this.width || y < 0 || y >= this.height)) {
      throw new errors.UserError(
          `Invalid move. (${x}, ${y}) out of board.`);
    }
    if (!pass && this.board[y][x] !== Board.FIELD_BLANK) {
      throw new errors.UserError(
          `Invalid move. There is already a stone at position (${x}, ${y}).`);
    }

    // change the fields
    const field = this.nextField;
    this.nextField = Board.getOppositeField(field);
    const move = {x, y, ended: false, pass: pass};

    // calculate the possible reverse points
    const possibleCount = this.calculateReversePoints(field);
    if (possibleCount === 0) {
      if (pass) {
        if (this.lastPass) {
          move.ended = true;
          this.calculateResultState();
        } else {
          ++this.currentOrder;
          utils.log('debug', {action: 'pass', field});
        }
      } else {
        throw new errors.UserError(
            `Invalid move. (${x}, ${y}) not able to reverse a single stone.`);
      }
    } else {
      if (pass) {
        console.log(this.reverseCount);
        throw new errors.UserError(
            `Invalid pass. Can not pass when there is a possible position.`);
      } else {
        if (this.reverseCount[y][x] > 0) {
          for (const i in this.directions) {
            const num = this.reverse(x, y, this.directions[i], field);
            if (num > 0) {
              this.reverse(x, y, this.directions[i], field, true);
            }
          }
          this.board[y][x] = field;
          this.order[y][x] = ++this.currentOrder;
          utils.log('debug', {action: 'place', position: [x, y], field, board: this.board});
        } else {
          throw new errors.UserError(
              `Invalid move. (${x}, ${y}) not able to reverse a single stone.`);
        }
      }
    }

    this.lastPass = pass;

    if (move.ended) {
      const info = {action: 'roundEnd', board: this.board};
      // if (state === STATE_WIN) {
      //   info.winningStones = winningStones;
      // }
      utils.log('debug', info);
    }

    return move;
  }

}
