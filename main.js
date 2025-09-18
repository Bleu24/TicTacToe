const board = document.querySelector('.board');
const cells = document.querySelectorAll('.cell');


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
            return;
        }
    }

    const reset = function() {
        board.forEach(row => row.forEach(cell => cell.input = ''));
    }


    return { getBoard, place, reset, isEmpty };

})();

// AI Module
const AI = (function() {

    const getEmptyCells = () => {
        const board = Gameboard.getBoard();
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
    }


    const easyMove = () => {
        const empty = getEmptyCells();
        return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
    }

    //Heuristic AI
    const mediumMove = (aiMarker, humanMarker) => {
        const empty = getEmptyCells();
        const board = Gameboard.getBoard();

        if(!empty.length) {
            return null;
        }

        if (empty[1][1].input === '') {
            return { row: 1, col: 1};
        }

        //Check for wins and return coords
        for (const cell of empty) {
            const simBoard = Gameboard.getBoard();
            simBoard[cell.row][cell.col].input = aiMarker
            if(isWinning(simBoard, aiMarker)) {
                return cell;
            };
        }

        //return cell for a winning human
        for (const cell of empty) {
            const simBoard = Gameboard.getBoard();
            simBoard[cell.row][cell.col].input = humanMarker
            if(isWinning(simBoard, humanMarker)) {
                return cell;
            };
        }

        const corners = [
            { row: 0, col: 0, opp: { row: 2, col: 2 } },
            { row: 0, col: 2, opp: { row: 2, col: 0 } },
            { row: 2, col: 0, opp: { row: 0, col: 2 } },
            { row: 2, col: 2, opp: { row: 0, col: 0 } },
        ];

        for (const cell of corners) {
            if(board[cell.row][cell.col].input === humanMarker && board[cell.opp.row][cell.opp.col] === '') {
                return { row: cell.opp.row, col: cell.opp.col };
            }
        }

        //returns the first empty corner
        for (const cell of corners) {
            if(board[cell.row][cell.col].input === '') {
                return { row: cell.row, col: cell.col };
            }
        }

        return easyMove(aiMarker, humanMarker);
    }


    const minimax = (board, isMaximizing, aiMarker, humanMarker) => {
        const empty = getEmptyCells();
    
        if (isWinning(board, aiMarker)) {
            return 1;
        }

        if (isWinning(board, humanMarker)) {
            return -1;
        }

        if (getEmptyCells().length === 0) {
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
                best = Math.min(best, minimax(board, false, aiMarker, humanMarker));
                board[cell.row][cell.col].input = '';
            }
            return best;
        }
    }




})();

// Game module
const Game = (function() {
    let isRoundWon = false;
    let hasStart = false;
    let currentTurn = 'X';
    let gameMode = '';
    
    const moveHistory = [];
    const scoreHistory = [];
    const playerPool = new Map();


    const applyMove = function(posX, posY, player) {
        if (!hasStart || isRoundWon) {
            return;
        }

        const success = Gameboard.place(posX, posY, player.team);
        if (success) {
            moveHistory.push({ name: player.name, posX, posY });
            currentTurn = currentTurn === 'X' ? 'O' : 'X';
            checkWinner();
        }

        if (!winner && gameMode === 'PvAI' && currentTurn === aiPlayer.team) {
            const move = AI.easyMove(aiPlayer.team, humanPlayer.team); 
            if (move) applyMove(move.row, move.col, aiPlayer);
        }
    };
    
    const start = (players, mode = 'PvAI') => {

        hasStart = true;
        gameMode = mode;
        
        Gameboard.reset();
        moveHistory.length = 0;
        isRoundWon = false;
        currentTurn = 'X';
    };
    
    function checkWinner() {
        const boardCopy = Gameboard.getBoard();
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
            if(!Gameboard.isEmpty(i,0) && boardCopy[i][0].input === boardCopy[i][1].input && boardCopy[i][1].input === boardCopy[i][2].input) {
                winner = boardCopy[i][0].input;
                isRoundWon = true;
                return winner;
            }

            // Vertical Check
            if(!Gameboard.isEmpty(0,i) && boardCopy[0][i].input === boardCopy[1][i].input && boardCopy[1][i].input === boardCopy[2][i].input) {
                winner = boardCopy[0][i].input;
                isRoundWon = true;
                return winner; 
            }
        }

        //Diagonal Checks
        if(!Gameboard.isEmpty(0,0) && boardCopy[0][0].input === boardCopy[1][1].input && boardCopy[1][1].input === boardCopy[2][2].input) {
            winner = boardCopy[0][0].input;
            isRoundWon = true;
            return winner;
        }

        if(!Gameboard.isEmpty(0,2) && boardCopy[0][2].input === boardCopy[1][1].input && boardCopy[1][1].input === boardCopy[2][0].input) {
            winner = boardCopy[0][2].input;
            isRoundWon = true;
            return winner;
        } 

        if (moveHistory.length === 9 && !isRoundWon) {
            console.log('No winners! It\'s a tie.');
            return winner;
        }
    }
    
    return { applyMove, start, checkWinner };
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

        const player = { id, name, team, requestMove };

        function requestMove(posX,posY) { 
            applyMove(posX, posY, player); 
        }

        playerPool.set(id, player);

        return player;
}

board.addEventListener('click', e => {

        if(!Game.hasStart) {

        }

        const cell = e.target.closest('.cell');
        if(cell) {
            const row = parseInt(cell.getAttribute('data-row') - 1);
            const col = parseInt(cell.getAttribute('data-col') - 1);

            if(Game.currentTurn === 'X') {
                cell.textContent = 'X';
                Game.currentTurn = 'O';
            } else {
                cell.textContent = 'O';
                Game.currentTurn = 'X';
            }
        }
})

    


