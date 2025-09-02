const Game = (function() {

    let wonRound = false;

    const history = []

    const board = [ 
        ['X', 'X', 'X'],
        ['X', '', 'X'],
        ['X', '', 'X']
    ];

    // Checks the board
    function checkBoard() {
        for (let i = 0; i < 3; i++) {
            
            if(wonRound) return;

            //Horizontal Check
            if (board[i][0] !== '' && board[i][0] === board[i][1] && board[0][1] === board[i][2]) {
                console.log(`Row ${i + 1} has winner`);
                wonRound = true;
            } else {
                console.log(`Row ${i + 1} no match`);
            }

            // Vertical Check
            if(board[0][i] !== '' && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
                console.log(`Column ${i + 1 } has winner`);
                wonRound = true;
            } else {
                console.log(`Column ${i + 1 } no match`);
            }
        }
    }



    
    
    return { checkBoard };

})();

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

const player1 = createPlayer("Breezus", "O");
console.log(player1);