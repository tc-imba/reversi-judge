const finder = require('../../build/Release/forbidden-point-finder');

finder.clear();
console.log(finder.addStone(7, 5, 'black'));
console.log(finder.addStone(0, 0, 'white'));
console.log(finder.addStone(7, 6, 'black'));
console.log(finder.addStone(0, 1, 'white'));
console.log(finder.addStone(5, 7, 'black'));
console.log(finder.addStone(0, 2, 'white'));
console.log(finder.addStone(6, 7, 'black'));
console.log(finder.addStone(0, 3, 'white'));
console.log(finder.addStone(7, 7, 'black'));
