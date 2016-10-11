import fs from 'fs';
import assert from 'assert';
import _ from 'lodash';

import errors from './errors';
import utils from './utils';

const derives = [[0, 1], [1, 0], [1, 1], [1, -1]];

const STATE_GOING = 0;
const STATE_WIN = 1;
const STATE_DRAW = 2;

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
    assert(nInRow > 1);
    utils.log('debug', { action: 'createBoard', width, height, nInRow });
    this.width = width;
    this.height = height;
    this.nInRow = nInRow;
    this.clear();
  }

  clear() {
    this.board = _.map(new Array(this.height), row => _.fill(new Array(this.width), Board.FIELD_BLANK));
    this.nextField = Board.FIELD_BLACK;
    this.state = Board.BOARD_STATE_GOING;
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
    } else if (fieldStat[Board.FIELD_BLACK] === fieldStat[Board.FIELD_WHITE] + 1) {
      this.nextField = Board.FIELD_WHITE;
    } else {
      throw new errors.UserError(`Invalid initial state, black = ${fieldStat[Board.FIELD_BLACK]}, white = ${fieldStat[Board.FIELD_WHITE]}.`);
    }
    utils.log('debug', { action: 'clearBoard', board: this.board, nextField: this.nextField });
  }

  getCurrentPlaces() {
    const places = [];
    this.board.forEach((row, y) => {
      row.forEach((field, x) => {
        if (field !== Board.FIELD_BLANK) {
          places.push({ x, y, field });
        }
      });
    });
    return places;
  }

  place(x, y) {
    assert(this.state === Board.BOARD_STATE_GOING);

    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      throw new errors.UserError(`Invalid move. Movement position out of board.`);
    }
    if (this.board[y][x] !== Board.FIELD_BLANK) {
      throw new errors.UserError(`Invalid move. There is already a stone at position (${x}, ${y}).`);
    }

    const field = this.nextField;
    this.board[y][x] = field;
    this.nextField = Board.getOppositeField(field);

    utils.log('debug', { action: 'place', position: [x, y], field });

    const move = { x, y, ended: false };
    const [ state, winningStones ] = this.getCurrentState(x, y, field);
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
      const info = { action: 'roundEnd', board: this.board };
      if (state === STATE_WIN) {
        info.winningStones = winningStones;
      }
      utils.log('debug', info);
    }

    return move;
  }

  getCurrentState(x, y, field) {
    for (const [dx, dy] of derives) {
      let count = 1;
      let x0, y0;
      let stones = [[x, y]];
      for (const dir of [1, -1]) {
        x0 = x + dir * dx;
        y0 = y + dir * dy;
        while (x0 >= 0 && x0 < this.width && y0 >= 0 && y0 < this.height && this.board[x0][y0] === field) {
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
    for (const row of this.board) {
      for (const field of row) {
        if (field !== Board.FIELD_BLANK) {
          return [STATE_GOING];
        }
      }
    }
    return [STATE_DRAW];
  }

}
