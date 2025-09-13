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
    }
    
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
                isRoundWon = true;
                return;
            }

            // Vertical Check
            if(!Gameboard.isEmpty(0,i) && boardCopy[0][i].input === boardCopy[1][i].input && boardCopy[1][i].input === boardCopy[2][i].input) {
                isRoundWon = true;
                return; 
            }
        }

        //Diagonal Checks
        if(!Gameboard.isEmpty(0,0) && boardCopy[0][0].input === boardCopy[1][1].input && boardCopy[1][1].input === boardCopy[2][2].input) {
            isRoundWon = true;
            return;
        }

        if(!Gameboard.isEmpty(0,2) && boardCopy[0][2].input === boardCopy[1][1].input && boardCopy[1][1].input === boardCopy[2][0].input) {
            isRoundWon = true;
            return;
        } 

        if (moveHistory.length === 9 && !isRoundWon) {
            console.log('No winners! It\'s a tie.');
            return;
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

    


