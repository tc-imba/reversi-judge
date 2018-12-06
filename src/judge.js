import _ from 'lodash';
import fs from 'fs';
import fsp from 'fs-promise';
import async from 'async';
import { argv } from 'yargs';

import utils from './libs/utils';
import Brain from './libs/brain';
import Board from './libs/board';
import errors from './libs/errors';
import exitCode from './libs/exitCode';

const MSG_CAUSED_BY_SYS = 'Judge system internal error';

const DEFAULT_BOARD_WIDTH = 20;
const DEFAULT_BOARD_HEIGHT = 20;
const DEFAULT_WINNING_STONES = 5;
const DEFAULT_START_TIMEOUT = 5000;
const DEFAULT_MOVE_TIMEOUT = 5000;
const DEFAULT_ROUND_TIMEOUT = 180000;
const DEFAULT_MEMORY_LIMIT = 350 * 1024 * 1024;

const BRAIN_IDS = ["0", "1"];

const roundConfig = {};
const brains = {};
const brainsConfig = {};

let board = null;
let argvConfig = {};
let hasShutdown = false;

function shutdown(exitCode, causedBy) {
  utils.log('debug', { action: 'shutdown', exitCode, causedBy });
  _.forEach(brains, brain => {
    brain.ignoreAllEvents = true;
    brain.kill();
  });

  if (argvConfig && argvConfig.summary) {
    const summaryData = {
      elapsedRoundTime: _.mapValues(brains, 'usedTime'),
      exitCausedBy: causedBy,
      currentBoard: board ? board.board : null,
      boardOrder: board ? board.order : null,
      roundConfig,
    };
    utils.log('info', { action: 'summary', data: summaryData });
    fs.writeFileSync(argvConfig.summary, JSON.stringify(summaryData));
  }

  hasShutdown = true;
  process.exit(exitCode);
}

function handleBrainError(id, err) {
  utils.log('info', { type: 'brainError', error: err.message, id });
  shutdown(exitCode.getCodeForBrainLose(id), `Brain ${id} error: ${err.message}`);
}

function handleBrainExit(id) {
  utils.log('info', { type: 'brainProcessExit', id });
  shutdown(exitCode.getCodeForBrainLose(id), `Brain ${id} process terminated`);
}

async function main() {
  if (argv.config) {
    try {
      argvConfig = JSON.parse((await fsp.readFile(argv.config)).toString());
    } catch (err) {
      utils.log('error', { message: `Failed to parse config from "argv.config": ${err.message}` });
      shutdown(exitCode.EXIT_ERROR, MSG_CAUSED_BY_SYS);
      return;
    }
  } else {
    argvConfig = argv;
  }
  for (const id of BRAIN_IDS) {
    brainsConfig[id] = {};
  }
  brainsConfig[0].field = argvConfig['brain0.field'];
  if (brainsConfig[0].field !== 'black' && brainsConfig[0].field !== 'white') {
    utils.log('error', { message: `Invalid argument "brain0.field", expecting "black" or "white", but received ${brainsConfig[0].field}` });
    shutdown(exitCode.EXIT_ERROR, MSG_CAUSED_BY_SYS);
    return;
  }
  // translate text to constant
  brainsConfig[0].field = Board.translateField(brainsConfig[0].field);
  brainsConfig[1].field = Board.getOppositeField(brainsConfig[0].field);

  _.forEach(brainsConfig, (config, id) => {
    config.bin = argvConfig[`brain${id}.bin`];
    if (config.bin === undefined) {
      utils.log('error', { message: `Missing argument "brain${id}.bin"` });
      shutdown(exitCode.EXIT_ERROR, MSG_CAUSED_BY_SYS);
      return;
    }
    try {
      fsp.accessSync(config.bin, fsp.constants.X_OK);
    } catch (ignore) {
      utils.log('error', { message: `Unable to access "${config.bin}"` });
      shutdown(exitCode.EXIT_ERROR, MSG_CAUSED_BY_SYS);
      return;
    }
    config.core = parseInt(argvConfig[`brain${id}.core`]);
    if (isNaN(config.core)) {
      config.core = false;
    }
    config.moveTimeout = parseInt(argvConfig[`brain${id}.moveTimeout`]);
    if (isNaN(config.moveTimeout)) {
      config.moveTimeout = DEFAULT_MOVE_TIMEOUT;
    }
    config.roundTimeout = parseInt(argvConfig[`brain${id}.roundTimeout`]);
    if (isNaN(config.roundTimeout)) {
      config.roundTimeout = DEFAULT_ROUND_TIMEOUT;
    }
    config.memoryLimit = parseInt(argvConfig[`brain${id}.memoryLimit`]);
    if (isNaN(config.memoryLimit)) {
      config.memoryLimit = DEFAULT_MEMORY_LIMIT;
    }
  });

  roundConfig.width = parseInt(argvConfig['round.width']);
  if (isNaN(roundConfig.width)) {
    roundConfig.width = DEFAULT_BOARD_WIDTH;
  }
  roundConfig.height = parseInt(argvConfig['round.height']);
  if (isNaN(roundConfig.height)) {
    roundConfig.height = DEFAULT_BOARD_HEIGHT;
  }
  roundConfig.winningStones = parseInt(argvConfig['round.winningStones']);
  if (isNaN(roundConfig.winningStones)) {
    roundConfig.winningStones = DEFAULT_WINNING_STONES;
  }

  utils.log('debug', { action: 'initialize', roundConfig: roundConfig, brainsConfig: brainsConfig });

  board = new Board(roundConfig.width, roundConfig.height, roundConfig.winningStones);
  try {
    board.clearFromFile(argvConfig.board);
  } catch (err) {
    utils.log('error', { message: `Unable to create board: ${err.message}` });
    shutdown(exitCode.EXIT_ERROR, MSG_CAUSED_BY_SYS);
    return;
  }

  // Spawn brain processes
  _.forEach(brainsConfig, (config, id) => {
    const brain = new Brain(id, {
      bin: config.bin,
      sandbox: argvConfig.sandbox,
      affinity: config.core,
      maxMemory: config.memoryLimit,
      maxTime: config.roundTimeout,  // TODO
    });
    brain.on('error', err => handleBrainError(id, err));
    brain.on('exit', code => handleBrainExit(id, code));
    brain.config = config;
    brains[id] = brain;
  });

  if (hasShutdown) {
    return;
  }

  // Send START to both side
  try {
    const places = board.getCurrentPlaces();
    await Promise.all(_.map(brains, brain => brain.emitErrorOnException(async () => {
      const resp = await brain.waitForOneResponse(DEFAULT_START_TIMEOUT, () => {
        brain.writeInstruction('START');
        places.forEach(place => {
          const field = place.field === brain.config.field ? 1 : 2;
          brain.writeInstruction(`PLACE ${place.x} ${place.y} ${field}`);
        });
        brain.writeInstruction('DONE');
      });
      if (resp !== 'OK') {
        throw new errors.UserError(`Expect "OK", but received "${resp}"`);
      }
    })));
  } catch (err) {
    if (err instanceof errors.UserError) {
      return;
    } else {
      throw err;
    }
  }

  // Send BEGIN or TURN
  let currentBrainId = brains[0].config.field === board.nextField ? 0 : 1;
  let lastMove = null;
  while (!hasShutdown && (lastMove === null || lastMove.ended === false)) {
    try {
      const brain = brains[currentBrainId];
      await brain.emitErrorOnException(async () => {
        const resp = await brain.waitForOneResponse(brain.config.moveTimeout, () => {
          if (lastMove === null) {
            brain.writeInstruction('BEGIN');
          } else if (lastMove.pass) {
            brain.writeInstruction('PASS');
          } else {
            brain.writeInstruction(`TURN ${lastMove.x} ${lastMove.y}`);
          }
        });
        let move;
        if (resp === 'PASS') {
          move = board.place(0, 0, true);
        } else {
          const m = resp.match(/^([a-z]) (\d+)$/);
          if (!m || m[2] < 1) {
            throw new errors.UserError(`Invalid response. Expect a movement like "[X] [Y]" or PASS.`);
          }
          const col = m[1].charCodeAt(0) - 'a'.charCodeAt(0);
          const row = m[2] - 1;
          move = board.place(col, row, false);
        }
        lastMove = move;
        currentBrainId = 1 - currentBrainId;
      });
    } catch (err) {
      if (err instanceof errors.UserError) {
        return;
      } else {
        throw err;
      }
    }
  }

  // Round ended
  let code;
  if (board.state === Board.BOARD_STATE_DRAW) {
    code = exitCode.EXIT_DRAW;
  } else if (board.state === Board.BOARD_STATE_WIN_BLACK) {
    if (brains[0].config.field === Board.FIELD_BLACK) {
      code = exitCode.EXIT_B0_WIN;
    } else {
      code = exitCode.EXIT_B1_WIN;
    }
  } else if (board.state === Board.BOARD_STATE_WIN_WHITE) {
    if (brains[0].config.field === Board.FIELD_WHITE) {
      code = exitCode.EXIT_B0_WIN;
    } else {
      code = exitCode.EXIT_B1_WIN;
    }
  } else {
    throw new Error(`Invalid board state ${board.state}`);
  }

  _.forEach(brain => brain.ignoreAllEvents = true);
  shutdown(code, '(normal round exit)');

  // TODO: match timeout and memory limit
}

main()
  .catch(e => {
    utils.log('error', { message: `Uncaught system exception: ${e.stack}` });
    shutdown(exitCode.EXIT_ERROR, MSG_CAUSED_BY_SYS);
  });
