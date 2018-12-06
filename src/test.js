import Board from './libs/board';

let board = new Board(8, 8, 5);
board.clearFromFile('opening.json');

board.place(3, 2);
board.place(2, 2);
board.place(1, 2);
board.place(1, 1);
// TURN b 2
board.place(1, 0);
board.place(0, 0);
// TURN a 1
board.place(2, 3);
board.place(2, 0);
// TURN c 1
board.place(2, 1);
board.place(3, 1);
// TURN d 2
board.place(3, 0);
board.place(4, 0);
// TURN e 1
board.place(0, 1);
board.place(0, 2);
// TURN a 3
board.place(5, 4);
board.place(4, 1);
// TURN e 2
board.place(5, 0);
board.place(6, 0);
// TURN g 1
board.place(0, 0, true);
