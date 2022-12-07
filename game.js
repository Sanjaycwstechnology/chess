game = new Chess();
// var socket = io();


 // const url = 'localhost:8080/';
 const url = '//all-market-chess.herokuapp.com/';
var connectionOptions =  {
	"force new connection" : true,
	"reconnectionAttempts": "Infinity",
	"timeout" : 10000,
	"transports" : ["websocket", "polling"]
};
window.socket = io.connect(url, connectionOptions);

var color = "white";
var players;
var roomId;
var play = true;

var chess_board2 = document.getElementById("chess_board")
var enter_room2 = document.getElementById("enter_room")
var room = document.getElementById("room")
var country_id = document.getElementById("country_id")
var user_id = document.getElementById("user_id")
var roomNumber = document.getElementById("roomNumbers")
var button = document.getElementById("button")
var state = document.getElementById('state')
var chessmyModal = document.getElementById('chessmyModal')
var game_heading = document.getElementById('game_heading')


var connect = function(){

    roomId = room.value;
    userId = user_id.value;
    countryID = country_id.value;
    if (roomId !== "" && parseInt(roomId) <= 999999) {
        $("#enter_room").hide();
        $("#chess_board").show();
        room.remove();   
        roomNumber.innerHTML = "Room Number : " + roomId;
        button.remove();
        socket.emit('joined', {roomId,userId,countryID});
    }
}

socket.on('full', function (msg) {
    if(roomId == msg)
         window.location.href = base_url+"chess/play/full";
});

socket.on('play', function (msg) {
    if (msg == roomId) {
        play = false;
        state.innerHTML = "Game in progress" 
          
    }
    // console.log(msg)
});

socket.on('move', function (msg) {
    if (msg.room == roomId) {
        game.move(msg.move);
        board.position(game.fen());
        console.log("moved")
    }
});

var removeGreySquares = function () {
    $('#board .square-55d63').css('background', '');
};

var greySquare = function (square) {
    var squareEl = $('#board .square-' + square);

    var background = '#a9a9a9';
    if (squareEl.hasClass('black-3c85d') === true) {
        background = '#696969';
    }

    squareEl.css('background', background);
};

var onDragStart = function (source, piece) {
    // do not pick up pieces if the game is over
    // or if it's not that side's turn
    if (game.game_over() === true || play ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
        (game.turn() === 'w' && color === 'black') ||
        (game.turn() === 'b' && color === 'white') ) {
            return false;
    }
    // console.log({play, players});
};

var onDrop = function (source, target) {
    removeGreySquares();

    // see if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    });
    // var gover = game.game_over();
    var gover = true;
    if (gover) {
        state.innerHTML = 'GAME OVER';
		var total_wallet_amount = $('#total_wallet_amount').val();
        var taken_time = $( "div.minutes" ).html();
        var last_turn = game.turn();
        socket.emit('gameOver', {roomId,userId,taken_time,last_turn,total_wallet_amount})
    }

    // illegal move
    if (move === null) return 'snapback';
    else
        socket.emit('move', { move: move, board: game.fen(), room: roomId });

};


socket.on('gameOver2', function ({msg,userId,taken_time,rows,last_turn}) {        
    console.log(msg);
    var game_amount =5;
    var winner ='';
    var game_status='';
    if(last_turn=='b' || last_turn =='w'){        
        if(last_turn=='b'){
            winner = 'White';
        }else{
            winner = 'Black';
        }

    }else{
        game_status = "draw"
        winner = 'No one';
    }
    console.log(game.in_checkmate());    
    console.log(rows);
    var result_player1_img = base_url+"uploads/users/profiles/"+rows[1].profile_pic;                                      
    var result_player2_img = base_url+"uploads/users/profiles/"+rows[0].profile_pic;
    $('#result_player1_img').attr('src', result_player1_img);
    $('#result_player2_img').attr('src', result_player2_img);
    $("#result_player1" ).html(rows[1].first_name+' '+rows[1].last_name);
    $("#result_player2" ).html(rows[0].first_name+' '+rows[0].last_name);
    $("#result_heading" ).html(winner + " is winner.");    
    state.innerHTML = 'GAME OVER';
    $( "div.minutes" ).html(taken_time);
    $('#chessmyModal222').trigger('click');
}); 

socket.on('settimer2', function ({msg}) {
    if(msg==roomId){
        $('#RootNode').trigger('click');        
    }
});

var onMouseoverSquare = function (square, piece) {
    // get list of possible moves for this square
    var moves = game.moves({
        square: square,
        verbose: true
    });

    // exit if there are no moves available for this square
    if (moves.length === 0) return;

    // highlight the square they moused over
    greySquare(square);

    // highlight the possible squares for this piece
    for (var i = 0; i < moves.length; i++) {
        greySquare(moves[i].to);
    }
};

var onMouseoutSquare = function (square, piece) {
    removeGreySquares();
};

var onSnapEnd = function () {
    board.position(game.fen());
};


socket.on('player', (msg) => {
    var plno = document.getElementById('player')
    color = msg.color;

    plno.innerHTML = 'Player ' + msg.players + " : " + color;
    players = msg.players;

    if(players == 2){
        play = false;
        socket.emit('play', msg.roomId);
        state.innerHTML = "Game in Progress"
        socket.emit('settimer', {roomId})
    }
    else
        state.innerHTML = "Waiting for Second player";


    var cfg = {
        orientation: color,
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare,
        onSnapEnd: onSnapEnd
    };
    board = ChessBoard('board', cfg);
});
// console.log(color)

var board;
