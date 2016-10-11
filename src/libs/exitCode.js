const exitCode = {};

exitCode.EXIT_B0_WIN = 1;
exitCode.EXIT_B1_WIN = 2;
exitCode.EXIT_DRAW = 3;
exitCode.EXIT_ERROR = 4;

exitCode.getCodeForBrainLose = (id) => {
  if (id === 0) {
    return exitCode.EXIT_B1_WIN;
  } else {
    return exitCode.EXIT_B0_WIN;
  }
};

exitCode.getCodeForBrainWin = (id) => {
  if (id === 0) {
    return exitCode.EXIT_B0_WIN;
  } else {
    return exitCode.EXIT_B1_WIN;
  }
};

export default exitCode;
