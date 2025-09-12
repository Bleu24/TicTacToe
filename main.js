document.addEventListener('DOMContentLoaded', () => {

    const board = document.querySelector('.board');
    const cells = document.querySelectorAll('.cell');

    const Game = (function() {

    let isRoundWon = false;
    let hasStart = false;
    let currentTurn = 'X'; //first turn
    

    const moveHistory = [];
    const scoreHistory = [];
    const playerPool = new Map();

    let board = [
        [{ id: '', input: '' }, { id: '', input: '' }, { id: '', input: '' }],
        [{ id: '', input: '' }, { id: '', input: '' }, { id: '', input: '' }],
        [{ id: '', input: '' }, { id: '', input: '' }, { id: '', input: '' }]
    ];

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
            applyMove(posX, posY, id); 
        }

        const player = { name, team };

        playerPool.set(id, player)

        return { ...player, requestMove };
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
        const lastMove = moveHistory.at(-1);

        if (lastMove === null || lastMove === undefined) {
            return;
        }

        if(isRoundWon) {
            return;
        }

        const lastName = lastMove.name;

         

        for (let i = 0; i < 3; i++) {
            
            //Horizontal Check
            if(board[i][0].input !== '' && board[i][0].input === board[i][1].input && board[i][1].input === board[i][2].input) {
                console.log(`Row ${i + 1} has winner finished by ${lastName}`);
                isRoundWon = true;
                break;
            } else {
                console.log(`Row ${i + 1} no match`);
            }

            // Vertical Check
            if(board[0][i].input !== '' && board[0][i].input === board[1][i].input && board[1][i].input === board[2][i].input) {
                console.log(`Column ${i + 1 } has winner finished by ${lastName}`);
                isRoundWon = true;
                break;
            } else {
                console.log(`Column ${i + 1 } no match`);
            }
        }

        //Diagonal Checks
        if(board[0][0].input !== '' && board[0][0].input === board[1][1].input && board[1][1].input === board[2][2].input) {
            console.log(`Main diagonal has winner finished by ${lastName}`);
            isRoundWon = true;
            return;
        } else {
            console.log('Main diagonal no match');
        }
        
        if(board[0][2].input !== '' && board[0][2].input === board[1][1].input && board[1][1].input === board[2][0].input) {
            console.log(`Anti-diagonal has winner finished by ${lastName}`);
            isRoundWon = true;
            return;
        } else {
            console.log('Anti-diagonal no match');
        }

        let hasTie = false;

        //Tie conditions
        if(moveHistory.length === 9 && !isRoundWon) {
            hasTie = true;
        }

        if (hasTie) {
            console.log('No winners!')
            return;
        }




    }

    function applyMove(posX, posY, id) {
        try {
            const lastMove = moveHistory.at(-1);
            const outOfBounds = (posX > 2 || posY > 2) || (posX < 0 || posY < 0);

            if(outOfBounds) {
                throw `Cell (${posX},${posY}) is out of bounds`;
            }

            const isCellEmpty = board[posX][posY].input === '';

            if(!isCellEmpty) {
                throw `Cell (${posX},${posY}) occupied by Player: ${lastMove.name}`;
            }
            
            const isIdAvailable = id !== '' && id !== null && id !== undefined && playerPool.has(id);

             if(!isIdAvailable) {
                throw `player id is ${id}`;
            }

            if(isRoundWon) {
                throw `Game is already finished! Please start a new game`;
            }

            if(isCellEmpty && !outOfBounds && !isRoundWon && isIdAvailable) { // Board can safely write if conditions are met
                
                if (currentTurn === 'X' && playerPool.get(id).team === 'X') {
                    board[posX][posY] = { id, ...playerPool.get(id), input: 'X' };
                    moveHistory.push({ id, ...playerPool.get(id), input: 'X' });
                    checkBoard();
                    currentTurn = 'O';
                    return;
                } else {
                    console.log(`Player ${playerPool.get(id).name} is team O`);
                }
                
                
                if (currentTurn === 'O' && playerPool.get(id).team === 'O') {
                    board[posX][posY] = { id, ...playerPool.get(id), input: 'O' };
                    moveHistory.push({ id, ...playerPool.get(id), input: 'O' });
                    checkBoard();
                    currentTurn = 'X';
                    return;
                } else {
                    console.log(`Player ${playerPool.get(id).name} is team X`);
                }
            
            }

        } catch (error) {
            console.log(error);
        }
        
    }

    function securePlayers() {
        
    }

    
    
    return { currentTurn, createPlayer, checkBoard, applyMove, hasStart };

    })();



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

    

});


