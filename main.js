// Shared player registry (used by createPlayer and Game)
const playerPool = new Map();


// Gameboard Module
const Gameboard = (function() {
    const board = [
        [{ input: '' }, { input: '' }, { input: '' }],
        [{ input: '' }, { input: '' }, { input: '' }],
        [{ input: '' }, { input: '' }, { input: '' }]
    ];

    const getBoard = () => board.map(row => row.map(cell => ({ input: cell.input })));
    const isEmpty = (posX, posY) => board[posX][posY].input === '';

    const place = function (posX, posY, marker) {
        try {
            const outOfBounds = (posX > 2 || posY > 2) || (posX < 0 || posY < 0);

            if(typeof posX !== 'number' && typeof posY !== 'number') {
                throw `Invalid data type`;
            }

            if(outOfBounds) {
                throw `Cell (${posX},${posY}) is out of bounds`;
            }

            if(!isEmpty(posX, posY)) {
                throw `Cell (${posX},${posY}) already occupied!`;
            }

            if ((marker !== 'X' && marker !== 'O') || typeof marker !== 'string') {
                throw `Wrong marker: ${marker}`;
            }
            
            board[posX][posY].input = marker;
            return true;    

        } catch (error) {
            console.log(error);
            return false;
        }
    }

    const reset = function() {
        board.forEach(row => row.forEach(cell => cell.input = ''));
    }


    return { getBoard, place, reset, isEmpty };

})();

// AI Module
const AI = (function() {

    const getEmptyCells = (board = Gameboard.getBoard()) => {
        const empty = [];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++ ) {
                if (board[i][j].input === '') {
                    empty.push({ row: i, col: j });
                }
            }
        }
        return empty;
    };

    const isWinning = (board, marker) => {
        // rows & cols
        for (let i = 0; i < 3; i++) {
            if (board[i][0].input === marker && board[i][1].input === marker && board[i][2].input === marker) {
                return true;
            } 
            if (board[0][i].input === marker && board[1][i].input === marker && board[2][i].input === marker) {
                return true;
            }
        }
        // diagonals
        if (board[0][0].input === marker && board[1][1].input === marker && board[2][2].input === marker) {
            return true;
        }
        if (board[0][2].input === marker && board[1][1].input === marker && board[2][0].input === marker) {
            return true;
        }
        return false;
    };


    const easyMove = (board = Gameboard.getBoard()) => {
        const empty = getEmptyCells(board);
        return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
    };

    //Heuristic AI
    const normalMove = (board, aiMarker, humanMarker) => {
        const empty = getEmptyCells(board);

        if(!empty.length) {
            return null;
        }

        if (board[1][1].input === '') {
            return { row: 1, col: 1};
        }

        //Check for wins and return coords
        for (const cell of empty) {
            board[cell.row][cell.col].input = aiMarker
            if(isWinning(board, aiMarker)) {
                board[cell.row][cell.col].input = '';
                return cell;
            };
            board[cell.row][cell.col].input = '';
        }

        //return cell for a winning human
        for (const cell of empty) {
            board[cell.row][cell.col].input = humanMarker
            if(isWinning(board, humanMarker)) {
                board[cell.row][cell.col].input = '';
                return cell;
            };
            board[cell.row][cell.col].input = '';
        }

        const corners = [
            { row: 0, col: 0, opp: { row: 2, col: 2 } },
            { row: 0, col: 2, opp: { row: 2, col: 0 } },
            { row: 2, col: 0, opp: { row: 0, col: 2 } },
            { row: 2, col: 2, opp: { row: 0, col: 0 } },
        ];

        for (const cell of corners) {
            if(board[cell.row][cell.col].input === humanMarker && board[cell.opp.row][cell.opp.col].input === '') {
                return { row: cell.opp.row, col: cell.opp.col };
            }

            if(board[cell.row][cell.col].input === '') {
                return { row: cell.row, col: cell.col };
            }
        }

        return easyMove(board);
    };


    const minimax = (board, isMaximizing, aiMarker, humanMarker) => {
        const empty = getEmptyCells(board);

        if (isWinning(board, aiMarker)) {
            return 1;
        }

        if (isWinning(board, humanMarker)) {
            return -1;
        }

        if (empty.length === 0) {
            return 0; 
        }


        if(isMaximizing){
            let best = -Infinity;
            for (const cell of empty) {
                board[cell.row][cell.col].input = aiMarker;
                best = Math.max(best, minimax(board, false, aiMarker, humanMarker));
                board[cell.row][cell.col].input = '';
            }
            return best;
        } else {
            let best = Infinity;
            for (const cell of empty) {
                board[cell.row][cell.col].input = humanMarker;
                best = Math.min(best, minimax(board, true, aiMarker, humanMarker));
                board[cell.row][cell.col].input = '';
            }
            return best;
        }
    };

    const hardMove = (board, aiMarker, humanMarker) => {
        const empty = getEmptyCells(board);

        let bestVal = -Infinity;
        let bestCell = null;

        for (const cell of empty) {
            board[cell.row][cell.col].input = aiMarker;
            const cellVal = minimax(board, false, aiMarker, humanMarker);
            board[cell.row][cell.col].input = '';

            if (cellVal > bestVal) {
                bestVal = cellVal;
                bestCell = cell;
            }
        }

        return bestCell;
    };

    return { easyMove, normalMove, hardMove }

})();

// Game module
const Game = (function() {
    let round = 0;
    let humanPlayer = null;
    let aiPlayer = null;
    let isRoundWon = false;
    let hasStart = false;
    let currentTurn = 'X';
    let gameMode = '';
    let aiDiff = '';
    const moveHistory = [];
    const scoreHistory = [];

    //config factory
    const start = (players = playerPool, mode = 'PvAI', aiDiffParam = 'normal') => {

        if(players.size === 0 ) {
            console.log("Create players first"); 
            return;
        }

        if(mode === 'PvAI' && players.size === 1) {
            const [humanId, humanPlayerObj] = players.entries().next().value;
            const aiId = crypto.randomUUID();
            const aiTeam = humanPlayerObj.team === 'X' ? 'O' : 'X';
            const aiPlayerObj = { id: aiId, name: 'AI', team: aiTeam };
            players.set(aiId, aiPlayerObj);

            humanPlayer = humanPlayerObj;
            aiPlayer = aiPlayerObj;
        } else if(mode === 'PvP' && players.size === 2) {
            const [player1, player2] = players.values();
            humanPlayer = player1;
            aiPlayer = null;
        }
        
        round = 0;
        hasStart = true;
        gameMode = mode;
        aiDiff = aiDiffParam;
        Gameboard.reset();
        moveHistory.length = 0;
        isRoundWon = false;
        currentTurn = 'X';

        return { currentTurn, round, gameMode, hasStart, isRoundWon }

    };

    const applyMove = function(posX, posY, player) {
        const board = Gameboard.getBoard();

        if (!hasStart || isRoundWon) {
            return false;
        }

        const success = Gameboard.place(posX, posY, player.team);

        if (success) {
            moveHistory.push({ name: player.name, posX, posY });
            const hasWinner = checkWinner();

            if(hasWinner) {
                console.log(`${hasWinner} wins!`);
                return true;
            }

            currentTurn = currentTurn === 'X' ? 'O' : 'X';
        }

        if (gameMode === 'PvAI' && currentTurn === aiPlayer.team) {
            setTimeout(() => {
                const move = aiDiff === 'easy' ? AI.easyMove(board)
                            : aiDiff === 'normal' ? AI.normalMove(board,aiPlayer.team, humanPlayer.team)
                            : AI.hardMove(board, aiPlayer.team, humanPlayer.team);
                if (move) applyMove(move.row, move.col, aiPlayer);
            }, 500); // 500ms delay
        }
    };
    
    function checkWinner() {
        const board = Gameboard.getBoard();
        const lastMove = moveHistory.at(-1);
        let winner = '';

        if (lastMove === null || lastMove === undefined) {
            return;
        }

        if(isRoundWon) {
            return;
        }
        
        for (let i = 0; i < 3; i++) {
            //Horizontal Check
            if(!Gameboard.isEmpty(i,0) && board[i][0].input === board[i][1].input && board[i][1].input === board[i][2].input) {
                winner = board[i][0].input;
                isRoundWon = true;
                return winner;
            }

            // Vertical Check
            if(!Gameboard.isEmpty(0,i) && board[0][i].input === board[1][i].input && board[1][i].input === board[2][i].input) {
                winner = board[0][i].input;
                isRoundWon = true;
                return winner; 
            }
        }

        //Diagonal Checks
        if(!Gameboard.isEmpty(0,0) && board[0][0].input === board[1][1].input && board[1][1].input === board[2][2].input) {
            winner = board[0][0].input;
            isRoundWon = true;
            return winner;
        }

        if(!Gameboard.isEmpty(0,2) && board[0][2].input === board[1][1].input && board[1][1].input === board[2][0].input) {
            winner = board[0][2].input;
            isRoundWon = true;
            return winner;
        } 

        if (moveHistory.length === 9 && !isRoundWon) {
            console.log('No winners! It\'s a tie.');
            isRoundWon = true; //semantic issue
            return 'tie';
        }
    }
    
    return { start, applyMove, checkWinner };
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

        function requestMove(posX,posY) { 
            // delegate to Game.applyMove so game logic is centralized
            const success = Game.applyMove(posX, posY, playerPool.get(id)); 
            if(!success) {
                console.log(`Invalid move by ${name} at (${posX}, ${posY})`);
            }
            return success;
        }

        const player = { id, name, team, requestMove };
        playerPool.set(id, player);
        return player;
}



const UI = (function() {

    const config = Game.start();
    const gamePanel = document.querySelector('.gamePanel');
    const moveHistory = document.querySelector('.history');
    const cardX = document.querySelector('.card.x');
    const cardDraw = document.querySelector('.card.draw');
    const cardO = document.querySelector('.card.o');
    const turn = document.querySelector('.label:nth-child(1)');
    const round = document.querySelector('.label:nth-child(2)');
    const mode = document.querySelector('.label:nth-child(3)');
    const reset = document.querySelector('.reset');
    const start = document.querySelector('.newGame');
    const modal = document.querySelector('.bg-modal');
    const form = document.querySelector('.gameMode');

    gamePanel.addEventListener('click', (e) => {
        if(e.target.closest('.newGame')) {
            console.log('I was clicked');
        }



    });


})();