const express = require('express');
const http = require('http');
const socket = require('socket.io');
const mysql = require('mysql2');
const port = process.env.PORT || 3000

var app = express();
const server = http.createServer(app)
const io = socket(server)
var players;
var joined = true;

// //MYSQL Connection Local
/*
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'market',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+05:30'
  });
  */
// //MYSQL Connection Local End

// //MYSQL Connection Production

const pool = mysql.createPool({
    host: 'all-markets-production.cgt6kyhcvyth.us-east-1.rds.amazonaws.com',
    user: 'admin',
    password: 'KZuUMHvOx3Gg2n1',
    database: 'all_market_prod',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+05:30'
  });

// //MYSQL Connection Production End

app.use(express.static(__dirname + "/"));

var games = Array(999999);
for (let i = 0; i < 999999; i++) {
    games[i] = {players: 0 , pid: [0 , 0]};
}
console.log(games);


app.get('/', (req, res) => {
	res.send('Chess is working');
    // res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    // console.log(players);
    var color;
    var playerId =  Math.floor((Math.random() * 100) + 1)

    console.log(playerId + ' connected');

    socket.on('joined', function ({roomId,userId,countryID}) {
        console.log(userId);
        let query = 'insert into waiting_room (user_id, room_id, country_id, status) values (?, ?, ?, ?)';
        pool.execute(query, [userId, roomId, countryID, 0], function(_, {affectedRows, insertId}){
               console.log(insertId);
               if(affectedRows > 0){
                   
               }
                   
        })
        console.log(games[roomId].players);
        if (games[roomId].players < 2) {
            games[roomId].players++;
            games[roomId].pid[games[roomId].players - 1] = playerId;
            let room = `room-${roomId}`;
            // socket.leave(oldRoom);
            socket.join(room);
        }
        else{
            socket.emit('full', roomId)
            return;
        }
        
        console.log(games[roomId]);
        players = games[roomId].players

        if (players % 2 == 0) color = 'black';
        else color = 'white';

        socket.emit('player', { playerId, players, color, roomId })
        // players--;

        
    });

    socket.on('move', function (msg) {
        socket.broadcast.emit('move', msg);
        // console.log(msg);
    });

    socket.on('play', function (msg) {

        socket.broadcast.emit('play', msg);
        let room = `room-${msg}`;
        io.of('/').to(room).emit("settimer2", {msg});        
        console.log("ready " + msg);
        console.log("Settimer " + msg);
    });
    
    socket.on('gameOver', function ({roomId,userId,taken_time,last_turn,total_wallet_amount}) {   
        console.log('Wallet amount ' + total_wallet_amount);	
        var game_amount = 5; 
        var total_cost = 10;       
        let query = `Select * from waiting_room 
        join chess_profile on chess_profile.user_id = waiting_room.user_id 
        where room_id = ?`;
        pool.execute(query, [roomId], function(err, rows, fields){
            if(rows){    
                                
                console.log(rows[0].user_id);
                var player2_id = rows[0].user_id;
                var player1_id = rows[1].user_id;  
				
				if(last_turn=='b' || last_turn =='w'){        
                    if(last_turn=='w'){
                        winner = 'White';
                        player1_game_status = 1;
                        player1_profit_share = 7;                    
                        player1_loss_share =0;
                        admin_profit_share = 3;
                        player2_game_status = 0;
                        player2_profit_share = 0;
                        player2_loss_share =5;                         
                    }
                    if(last_turn=='b'){
                        winner = 'Black';
                        player1_game_status = 0;
                        player1_profit_share = 0;                    
                        player1_loss_share =5;
                        admin_profit_share = 3;
                        player2_game_status = 1;
                        player2_profit_share = 7;
                        player2_loss_share =0;                         
                    }
					
					let player1_query1 = 'UPDATE chess_profile SET total_game = total_game-1 WHERE user_id = ?';
					pool.execute(player1_query1, [player1_id], function(_, {affectedRows, insertId}){										
						if(affectedRows > 0){
							console.log("Player1 game decreased by one: " + insertId);
						}
							
					}) 
					let player2_query12 = 'UPDATE chess_profile SET total_game = total_game-1 WHERE user_id = ?';
					pool.execute(player2_query12, [player2_id], function(_, {affectedRows, insertId}){										
						if(affectedRows > 0){
							console.log("Player2 game decreased by one: " + insertId);
						}
							
					}) 					  					
            
                }else{
                    winner = 'Draw';
                    player1_game_status = 2;
                    player1_profit_share = 0;                    
                    player1_loss_share =0;
                    admin_profit_share = 0;
                    player2_game_status = 2;
                    player2_profit_share = 0;
                    player2_loss_share =0;                    
                }                              
                
                let play_query1 = 'insert into play_history (user_id, game_amount, roomid, game_status) values (?, ?, ?, ?)';
                pool.execute(play_query1, [player1_id, game_amount, roomId, player1_game_status], function(_, {affectedRows, insertId}){    
                    console.log("Last Insert ID "+insertId);
                       if(affectedRows > 0){
							let player1_query = 'insert into game_over_transaction (game_id,user_id,cost_per_game,total_cost,profit_share,loss_share) values (?, ?, ?, ?, ?,?)';
							pool.execute(player1_query, [insertId, player1_id, game_amount,total_cost,player1_profit_share,player1_loss_share], function(_, {affectedRows, insertId}){
								if(affectedRows > 0){
									console.log("Player 1 game_over_transaction id : " + insertId);
									let player1_query1 = 'insert into wallet (user_id,game_over_transaction_id,amount) values (?, ?, ?)';
									pool.execute(player1_query1, [player1_id, insertId, player1_profit_share], function(_, {affectedRows, insertId}){										
										if(affectedRows > 0){
											console.log("Player 1 wallet insert id : " + insertId);
										}
											
									}) 									
								}
									
							})                          
                       }
                           
                })  
                
                let play_query2 = 'insert into play_history (user_id, game_amount, roomid, game_status) values (?, ?, ?, ?)';
                pool.execute(play_query2, [player2_id, game_amount, roomId, player2_game_status], function(_, {affectedRows, insertId}){    
                    console.log("Last Insert ID "+insertId);
                        if(affectedRows > 0){
                            let player2_query = 'insert into game_over_transaction (game_id,user_id,cost_per_game,total_cost,profit_share,loss_share) values (?, ?, ?, ?, ?,?)';
                            pool.execute(player2_query, [insertId, player2_id, game_amount,total_cost,player2_profit_share,player2_loss_share], function(_, {affectedRows, insertId}){
                                console.log(insertId);
                                if(affectedRows > 0){
									console.log("Player 2 game_over_transaction id : " + insertId);
									let player1_query2 = 'insert into wallet (user_id,game_over_transaction_id,amount) values (?, ?, ?)';
									pool.execute(player1_query2, [player2_id, insertId, player2_profit_share], function(_, {affectedRows, insertId}){										
										if(affectedRows > 0){
											console.log("Player 2 wallet insert id : " + insertId);
										}											
									})                                     
                                }
                                
                            })                          
                        }
                           
                })

                if(player1_game_status == 1 || player2_game_status ==1){
                    var admin_game_status = 1;
                }else{
                    var admin_game_status = 0;
                }

                let play_query3 = 'insert into play_history (user_id, game_amount, roomid, game_status) values (?, ?, ?, ?)';
                pool.execute(play_query3, [0, game_amount, roomId, admin_game_status], function(_, {affectedRows, insertId}){    
                    console.log("Last Insert ID "+insertId);
                        if(affectedRows > 0){
                            let player2_query = 'insert into game_over_transaction (game_id,user_id,cost_per_game,total_cost,profit_share,loss_share) values (?, ?, ?, ?, ?,?)';
                            pool.execute(player2_query, [insertId, 0, game_amount,total_cost,admin_profit_share,0], function(_, {affectedRows, insertId}){
                                console.log(insertId);
                                if(affectedRows > 0){
									let player1_query1 = 'insert into wallet (user_id,game_over_transaction_id,amount) values (?, ?, ?)';
									pool.execute(player1_query1, [0, insertId, admin_profit_share], function(_, {affectedRows, insertId}){										
										if(affectedRows > 0){
											console.log("Admin wallet insert id : " + insertId);
										}
											
									}) 	                                    
                                }
                                
                            })                          
                        }
                           
                })                


                let room = `room-${roomId}`;
                console.log("Room " + room);        
                io.of('/').to(room).emit("gameOver2", {roomId,userId,taken_time,rows,last_turn});
                console.log("Game Over 2" + room);
                console.log("Game Over 2" + rows[1].profile_pic);
                
            }else{
                console.log(err);
            }
        })        
    });           

    // socket.on('endGameResult', function ({user_id,game_amount,msg2,winner}) {                   
    //        if(winner=='White'){        
    //             game_status = 1;
    //         }
    //         if(winner=='Black'){
    //             game_status = 1;
    //         }
    //         if(winner=='draw'){
    //             game_status = 2;
    //         }
    //         console.log("End Game users "+ user_id); 
    //         console.log("End Game users "+ game_amount); 
    //         console.log("End Game users "+ msg2); 
    //         console.log("End Game users "+ winner);       
    //         let query = 'insert into play_history (user_id, game_amount, roomid, game_status) values (?, ?, ?, ?)';
    //         pool.execute(query, [user_id, game_amount, msg2, game_status], function(_, {affectedRows, insertId}){    
    //             console.log("Last Insert ID "+insertId);
    //                if(affectedRows > 0){
    //                   let query = 'insert into game_over_transaction (game_id,user_id,cost_per_game,total_cost,profit_share,loss_share) values (?, ?, ?, ?, ?,?)';
                      
    //                }
                       
    //         })                                 
    // });    

    socket.on('disconnect', function () {
        for (let i = 0; i < 100; i++) {
            if (games[i].pid[0] == playerId || games[i].pid[1] == playerId)
                games[i].players--;
        }
        console.log(playerId + 'disconnected');

    }); 

    
});

server.listen(port);
console.log('Connected at '+ port);