import Board from './libs/board';

let board = new Board(8, 8, 5);
board.clearFromFile('opening.json');

board.place(3, 2);
board.place(2, 2);
