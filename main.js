const Game = (function() {

    let isRoundWon = false;
    let currentTurn = 'X'; //first turn


    const moveHistory = []; 

    const board = [ 
        ['', '', ''],
        ['', '', ''],
        ['', '', '']
    ];

    function createPlayer(name = "Noname", team) {
        if (team === '' || typeof team !== 'string' || typeof name !== 'string' || name === '') {
            console.log('Please double check input');
            return;
        }

        if (team !== 'X' && team !== 'O') {
            return;
        } 

        return { name, team };
    }

    function restartGame() {
        isRoundWon = false;
        board = [ 
            ['', '', ''],
            ['', '', ''],
            ['', '', '']
        ];
    }

    // Checks the board
    function checkBoard() {
        for (let i = 0; i < 3; i++) {
            
            if(isRoundWon) {
                restartGame();
                break;
            }
            
            //Horizontal Check
            if (board[i][0] !== '' && board[i][0] === board[i][1] && board[0][1] === board[i][2]) {
                console.log(`Row ${i + 1} has winner`);
                isRoundWon = true;
                break;
            } else {
                console.log(`Row ${i + 1} no match`);
            }

            // Vertical Check
            if(board[0][i] !== '' && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
                console.log(`Column ${i + 1 } has winner`);
                isRoundWon = true;
                break;
            } else {
                console.log(`Column ${i + 1 } no match`);
            }
        }
    }

    function applyMove(posX, posY) {
        try {
            const isCellEmpty = board[posX][posY] === '';
            const outOfBounds = (posX > 2 || posY > 2) || (posX < 0 || posY < 0);

            if(isCellEmpty && !outOfBounds && !isRoundWon) { // Board can safely write if conditions are met
                
                if (currentTurn === 'X') {
                    board[posX][posY] = 'X';
                    moveHistory.push('X');
                    checkBoard();
                    currentTurn = 'O';
                } else {
                    board[posX][posY] = 'O';
                    moveHistory.push('O');
                    checkBoard();
                    currentTurn = 'X';
                }
            
            }

            if(!isCellEmpty) {
                const lastMove = moveHistory.at(-1);
                throw `Cell (${posX},${posY}) occupied by team ${lastMove}`;
            }

            if(outOfBounds) {
                throw `Cell (${posX},${posY}) is out of bounds`;
            }

            if(isRoundWon) {
                throw `Game is finished!`;
            }

        } catch (error) {
            console.log(error);
        }
        
    }

    



    
    
    return { createPlayer, checkBoard, applyMove };

})();


Game.applyMove(0,0);
Game.applyMove(1,0); // Should be invalid and currentTurn must be O
Game.applyMove(0,1);
Game.applyMove(1,1);
Game.applyMove(0,2); // must log winner
Game.applyMove(1,2); // no longer writes to board;