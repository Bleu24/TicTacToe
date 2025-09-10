const Game = (function() {

    let isRoundWon = false;
    let currentTurn = 'X'; //first turn


    const moveHistory = [];
    const playerPool = new Map();

    const board = [
        [{ id: '', input: '' }, { id: '', input: '' }, { id: '', input: '' }],
        [{ id: '', input: '' }, { id: '', input: '' }, { id: '', input: '' }],
        [{ id: '', input: '' }, { id: '', input: '' }, { id: '', input: '' }]
    ];

    function createPlayer(name = "Noname", team) {


        const id = crypto.randomUUID();

        if (team === '' || typeof team !== 'string' || typeof name !== 'string' || name === '') { 
            console.log('Please double check input');
            return;
        }

        if (team !== 'X' && team !== 'O') {
            return;
        } 

        function requestMove(posX,posY) { 
            applyMove(posX, posY, id); 
        }

        const player = { name, team, requestMove };

        playerPool.set(id, player)

        return player;
    }

    function restartGame() {
        isRoundWon = false;
        board = [ 
            [{ id: '', input: '' }, { id: '', input: '' }, { id: '', input: '' }],
            [{ id: '', input: '' }, { id: '', input: '' }, { id: '', input: '' }],
            [{ id: '', input: '' }, { id: '', input: '' }, { id: '', input: '' }]
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
            if(board[i][0].input !== '' && board[i][0].input === board[i][1].input && board[0][1].input === board[i][2].input) {
                console.log(`Row ${i + 1} has winner finished by ${moveHistory.at(-1).name}`);
                isRoundWon = true;
                break;
            } else {
                console.log(`Row ${i + 1} no match`);
            }

            // Vertical Check
            if(board[0][i].input !== '' && board[0][i].input === board[1][i].input && board[1][i].input === board[2][i].input) {
                console.log(`Column ${i + 1 } has winner finished by ${moveHistory.at(-1).name}`);
                isRoundWon = true;
                break;
            } else {
                console.log(`Column ${i + 1 } no match`);
            }

            //Diagonal Checks
            if(board[0][0].input !== '' && board[0][0].input === board[1][1].input && board[1][1].input === board[2][2].input) {
                console.log(`Main diagonal has winner finished by ${moveHistory.at(-1).name}`);
                isRoundWon = true;
                break;
            } else {
                console.log('Main diagonal no match');
            }
            
            if(board[0][2].input !== '' && board[0][2].input === board[1][1].input && board[1][1].input === board[2][0].input) {
                console.log(`Anti-diagonal has winner finished by ${moveHistory.at(-1).name}`);
                isRoundWon = true;
                break;
            } else {
                console.log('Anti-diagonal no match');
            }
        }
    }

    function applyMove(posX, posY, id) {
        try {
            const isCellEmpty = board[posX][posY].input === '';
            const outOfBounds = (posX > 2 || posY > 2) || (posX < 0 || posY < 0);
            const isIdAvailable = id !== '' && id !== null && id !== undefined && playerPool.has(id);

            if(isCellEmpty && !outOfBounds && !isRoundWon && isIdAvailable) { // Board can safely write if conditions are met
                
                if (currentTurn === 'X') {
                    board[posX][posY] = { id, ...playerPool.get(id), input: 'X' };
                    moveHistory.push({ id, ...playerPool.get(id), input: 'X' });
                    checkBoard();
                    currentTurn = 'O';
                } else {
                    board[posX][posY] = { id, ...playerPool.get(id), input: 'O' };
                    moveHistory.push({ id, ...playerPool.get(id), input: 'O' });
                    checkBoard();
                    currentTurn = 'X';
                }
            
            }

            if(!isCellEmpty) {
                const lastMove = moveHistory.at(-1);
                throw `Cell (${posX},${posY}) occupied by Player: ${lastMove.id}`;
            }

            if(outOfBounds) {
                throw `Cell (${posX},${posY}) is out of bounds`;
            }

            if(!isIdAvailable) {
                throw `player id is ${id}`;
            }

            if(isRoundWon) {
                throw `Game is already finished! Please start a new game`;
            }

        } catch (error) {
            console.log(error);
        }
        
    }

    



    
    
    return { createPlayer, checkBoard, applyMove };

})();

const ex1 = Game.createPlayer('Bryan', 'X');
const oh1 = Game.createPlayer('James', 'O');
const ex2 = Game.createPlayer('Justin', 'X');


// Sequence arranged so O wins (fills column 0 on turns 2,4,6)
ex1.requestMove(0,0); // X
oh1.requestMove(0,1); // O
ex2.requestMove(1,1); // X
oh1.requestMove(0,2); // O
ex1.requestMove(2,2); // X -> should log winner
