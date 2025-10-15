import { playerPool } from "./playerPool.ds";
import { Gameboard } from "./gameBoard";
import { AI } from "./ai";
import { UI } from "../main";

const Game = (function () {
    let round = 0;
    let humanPlayer = null;
    let aiPlayer = null;
    let humanPlayer1 = null;
    let humanPlayer2 = null;
    let isRoundWon = false;
    let hasStart = false;
    let currentTurn = 'X';
    let startingTeam = 'X';
    let gameMode = '';
    let aiDiff = '';
    let lastStartOptions = null;
    const moveHistory = [];
    const matchHistory = [];
    const scores = { X: 0, O: 0, draw: 0 };
    let totalRounds = 1;

    // Reset all game state, scores, and history
    const reset = () => {
        round = 0;
        humanPlayer = null;
        aiPlayer = null;
        humanPlayer1 = null;
        humanPlayer2 = null;
        isRoundWon = false;
        hasStart = false;
        currentTurn = 'X';
        gameMode = '';
        aiDiff = '';
        totalRounds = 1;
        scores.X = 0;
        scores.O = 0;
        scores.draw = 0;
        moveHistory.length = 0;
        matchHistory.length = 0;
        Gameboard.reset();
    };

    //config factory
    const start = (players = playerPool, mode, aiDiffParam = 'none', rounds = 1) => {

        // capture the players as they were passed in (before start may add an AI)
        const playersPassedSnapshot = Array.from(players.values()).map(p => ({ id: p.id, name: p.name, team: p.team }));

        if (players.size === 0) {
            console.log("Create players first");
            return;
        }

        if (mode === 'PvAI' && players.size === 1) {
            const [humanId, humanPlayerObj] = players.entries().next().value;
            const aiId = crypto.randomUUID();
            const aiTeam = humanPlayerObj.team === 'X' ? 'O' : 'X';
            const aiPlayerObj = { id: aiId, name: 'AI', team: aiTeam };
            players.set(aiId, aiPlayerObj);
            humanPlayer = humanPlayerObj;
            aiPlayer = aiPlayerObj;
        } else if (mode === 'PvP' && players.size === 2) {
            const [p1, p2] = players.values();
            humanPlayer1 = p1;
            humanPlayer2 = p2;
        }
        // Common reset for either mode
        round = 0;
        totalRounds = rounds || 1;
        scores.X = 0;
        scores.O = 0;
        scores.draw = 0;
        hasStart = true;
        gameMode = mode;
        aiDiff = aiDiffParam;
        Gameboard.reset();
        moveHistory.length = 0;
        isRoundWon = false;
        // determine starting team for the match
        startingTeam = 'X';
        if (mode === 'PvAI' && players.size === 1 && humanPlayer && humanPlayer.team === 'O') {
            // human chose O, AI should start (AI is X)
            startingTeam = aiPlayer ? aiPlayer.team : 'X';
        }
        currentTurn = startingTeam;

        // save last start options for rematch
        lastStartOptions = { players: playersPassedSnapshot, mode, aiDiff: aiDiffParam, rounds };

        // if AI should start immediately, schedule its move
        if (gameMode === 'PvAI' && aiPlayer && currentTurn === aiPlayer.team) {
            setTimeout(() => {
                const board = Gameboard.getBoard();
                const move = aiDiff === 'easy' ? AI.easyMove(board)
                    : aiDiff === 'normal' ? AI.normalMove(board, aiPlayer.team, humanPlayer.team)
                        : AI.hardMove(board, aiPlayer.team, humanPlayer.team);
                if (move) applyMove(move.row, move.col);
            }, 500);
        }
    };

    const getCurrentPlayer = () => {
        if (gameMode === 'PvAI') {
            if (!humanPlayer || !aiPlayer) return null;
            return currentTurn === humanPlayer.team ? humanPlayer : aiPlayer;
        }
        if (gameMode === 'PvP') {
            if (!humanPlayer1 || !humanPlayer2) return null;
            return currentTurn === humanPlayer1.team ? humanPlayer1 : humanPlayer2;
        }
        return null;
    };

    const handleRoundEnd = (winner) => {

        if (winner.team === 'X') {
            scores.X++;
        } else if (winner.team === 'O') {
            scores.O++;
        } else if (winner === 'tie') {
            scores.draw++;
        }

        // Save this round to matchHistory
        matchHistory.push({
            round: round + 1,
            moves: moveHistory.slice(),
            winner: winner === 'tie' ? 'tie' : (winner && winner.team ? winner.team : null),
            winningCells: winner && winner.winningCells ? winner.winningCells : null
        });

        if (round + 1 < totalRounds) {
            setTimeout(() => {
                round++;
                isRoundWon = false;
                Gameboard.reset();
                moveHistory.length = 0;
                // alternate starting team each round
                startingTeam = startingTeam === 'X' ? 'O' : 'X';
                currentTurn = startingTeam;
                UI.updateBoardContent(Gameboard.getBoard());
                setTimeout(() => { if (winner && winner.winningCells) UI.removeHighlight(winner.winningCells); }, 500);
                UI.updatePanelContent();

                // if AI should start this round, schedule its move
                if (gameMode === 'PvAI' && aiPlayer && currentTurn === aiPlayer.team) {
                    setTimeout(() => {
                        const board = Gameboard.getBoard();
                        const move = aiDiff === 'easy' ? AI.easyMove(board)
                            : aiDiff === 'normal' ? AI.normalMove(board, aiPlayer.team, humanPlayer.team)
                                : AI.hardMove(board, aiPlayer.team, humanPlayer.team);
                        if (move) applyMove(move.row, move.col);
                    }, 500);
                }
            }, 1000);
        } else {
            hasStart = false;
            // show match end modal with summary
            if (typeof UI !== 'undefined' && UI.showMatchEndModal) {
                // pass the full winner object (or 'tie') so UI can access team and winningCells
                UI.showMatchEndModal({ winner: winner, scores: { ...scores } });
            }
            UI.updatePanelContent();
            console.log('Match finished', scores);
        }
    }

    const applyMove = function (posX, posY) {

        if (!hasStart || isRoundWon) {
            return false;
        }

        const player = getCurrentPlayer();
        const success = Gameboard.place(posX, posY, currentTurn);

        if (success) {
            moveHistory.push({ name: (player && player.name) ? player.name : currentTurn, posX, posY, currentTurn });
            UI.updateBoardContent(Gameboard.getBoard());
            UI.updatePanelContent();
            const hasWinner = checkWinner();

            if (hasWinner) {
                handleRoundEnd(hasWinner);
                return true;
            }

            currentTurn = currentTurn === 'X' ? 'O' : 'X';

        }

        if (gameMode === 'PvAI' && aiPlayer && humanPlayer && currentTurn === aiPlayer.team) {
            setTimeout(() => {
                const board = Gameboard.getBoard();
                const move = aiDiff === 'easy' ? AI.easyMove(board)
                    : aiDiff === 'normal' ? AI.normalMove(board, aiPlayer.team, humanPlayer.team)
                        : AI.hardMove(board, aiPlayer.team, humanPlayer.team);
                if (move) applyMove(move.row, move.col);
            }, 500);
        }
    };

    const checkWinner = () => {
        const board = Gameboard.getBoard();
        const lastMove = moveHistory.at(-1);
        let winner = { team: '', winningCells: null };

        if (lastMove === null || lastMove === undefined) {
            return;
        }

        if (isRoundWon) {
            return;
        }

        for (let i = 0; i < 3; i++) {
            //Horizontal Check
            if (!Gameboard.isEmpty(i, 0) && board[i][0].input === board[i][1].input && board[i][1].input === board[i][2].input) {
                winner.team = board[i][0].input;
                winner.winningCells = { cell1: { row: i, col: 0 }, cell2: { row: i, col: 1 }, cell3: { row: i, col: 2 } };
                UI.highlightGridWinner(winner.winningCells);
                isRoundWon = true;
                return winner;
            }

            // Vertical Check
            if (!Gameboard.isEmpty(0, i) && board[0][i].input === board[1][i].input && board[1][i].input === board[2][i].input) {
                winner.team = board[0][i].input;
                winner.winningCells = { cell1: { row: 0, col: i }, cell2: { row: 1, col: i }, cell3: { row: 2, col: i } };
                UI.highlightGridWinner(winner.winningCells);
                isRoundWon = true;
                return winner;
            }
        }

        //Diagonal Checks
        if (!Gameboard.isEmpty(0, 0) && board[0][0].input === board[1][1].input && board[1][1].input === board[2][2].input) {
            winner.team = board[0][0].input;
            winner.winningCells = { cell1: { row: 0, col: 0 }, cell2: { row: 1, col: 1 }, cell3: { row: 2, col: 2 } };
            UI.highlightGridWinner(winner.winningCells);
            isRoundWon = true;
            return winner;
        }

        if (!Gameboard.isEmpty(0, 2) && board[0][2].input === board[1][1].input && board[1][1].input === board[2][0].input) {
            winner.team = board[0][2].input;
            winner.winningCells = { cell1: { row: 0, col: 2 }, cell2: { row: 1, col: 1 }, cell3: { row: 2, col: 0 } };
            UI.highlightGridWinner(winner.winningCells);
            isRoundWon = true;
            return winner;
        }

        if (moveHistory.length === 9 && !isRoundWon) {
            console.log('No winners! It\'s a tie.');
            isRoundWon = true;
            return 'tie';
        }
    }

    const getState = () => {
        return { currentTurn, round, gameMode, hasStart, isRoundWon, totalRounds, scores, aiDiff };
    }

    const getMoveHistory = () => {
        const deepCopy = [];

        for (const element of moveHistory) {
            if (element && typeof element === 'object') {
                const newObj = {};
                for (const key in element) {
                    newObj[key] = element[key];
                }
                deepCopy.push(newObj);
            }
            else {
                deepCopy.push(element);
            }
        }

        return deepCopy;
    }

    const getMatchHistory = () => {
        // return a deep copy
        return matchHistory.map(r => ({ round: r.round, winner: r.winner, moves: r.moves.map(m => ({ ...m })), winningCells: r.winningCells }));
    }

    const rematch = () => {
        if (!lastStartOptions) return;

        // rebuild players map from snapshot
        const playersMap = new Map();
        // clear existing pool to avoid duplicates
        playerPool.clear();
        for (const p of lastStartOptions.players) {
            // recreate player entries using same id
            const player = { id: p.id || crypto.randomUUID(), name: p.name, team: p.team };
            playerPool.set(player.id, player);
            playersMap.set(player.id, player);
        }

        // Reset internal state but keep players
        round = 0;
        scores.X = 0;
        scores.O = 0;
        scores.draw = 0;
        moveHistory.length = 0;
        matchHistory.length = 0;
        Gameboard.reset();
        hasStart = false;

        // Start match with same options
        start(playersMap, lastStartOptions.mode, lastStartOptions.aiDiff, lastStartOptions.rounds);
    }


    return { start, applyMove, checkWinner, getState, getMoveHistory, getMatchHistory, reset, rematch };
})();


// Player factory
function createPlayer(name, team) {
    const id = crypto.randomUUID();

    if (team === '' || typeof team !== 'string' || typeof name !== 'string' || name === '') {
        console.log('Please double check input');
        return;
    }

    if (team !== 'X' && team !== 'O') {
        return;
    }

    const player = { id, name, team };
    playerPool.set(id, player);
    return player;
}

export { Game, createPlayer };