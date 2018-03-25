
/* Les variables en dessous sont des variables globaux sur le js */
var express = require('express');
var app = express();

httpServer = require('http').createServer(app).listen(8080),
io = require('socket.io').listen(httpServer),
fs = require('fs');
var mysql = require('mysql')

// Chargement de la page index.html

app.use(express.static('public'));

app.get('/', function (req, res) {
	res.sendfile(__dirname + '/index.html');
});

var connection = mysql.createConnection({
	host : 'localhost',
	user: 'root',
	password: '',
	database: 'demo'
})

connection.connect(function(err){
	if(err){
		console.log("Connexion echouée")
	}
})


var io = require('socket.io').listen(httpServer);
var users = {}
var messages = []
var limite = 5
/* io.sockets connection est une variable relative à chaque utilisateur */
/* Côté Serveur */
io.sockets.on('connection', function(socket){ 

	console.log("Nouveau utilisateur")

	var me = false;

	for(var k in users){
		console.log(users[k])
		socket.emit('newusr',users[k])
	}
	for(var k in messages){
		socket.emit('newmsg',messages[k])
	}

			/**
			 * On a reçu un msg
			 */

			 socket.on('newmsg', function(message){

			 	message.user = me
			 	date = new Date()
			 	message.h = date.getHours()
			 	message.m = date.getMinutes()
			 	messages.push(message)
			 	if(messages.length > limite){
					messages.shift() //Supression des vieux messages lorsqu'on depasse la limite
				}
				io.sockets.emit('newmsg',message)
			})

			/**
			 * Je me connecte
			 */
			 socket.on('login',function(user){

			 	console.log(user)

			 	connection.query('SELECT * FROM userss WHERE user = ?', [user.username],function(err,rows,fields){
			 		if(err){
			 			socket.emit('error',err)
			 			return false
			 		}

			 		me = {}
			 		me.username = user.username
			 		me.password = user.password
			 		me.id = user.password
			 		if(me.id === ''){
						socket.emit('alerte2',user)
					}else{
						if(rows.length === 0){

							socket.emit('logged')
							users[me.id]=me
							console.log(me.id)
							io.sockets.emit('newusr',me)
							connection.query('INSERT INTO userss values (?,?,?)',[me.id,me.username,me.password])
   
						}
						else{
							
							connection.query('SELECT * FROM userss WHERE user = ?', [user.username],function(err,rows,fields){
								
								if(err){
									socket.emit('error',err.code)
									return false
								}	
								if(rows[0].pass === me.password){
									var res = rows[0].user; 
									console.log(res)
									var test = 0;
									for(var k in users){
										console.log(k)
										if(res.toUpperCase() === users[k].username.toUpperCase()){
											test = 1
										}
									}
									console.log(test)
									if(test===1){
										socket.emit('alerte',user)
									}else{
										socket.emit('logged')
										users[me.id]= user
										io.sockets.emit('newusr',user)
									}
								}	
								else{
									socket.emit('mdp',user)
								}
   
							})
						}
   
					}
			 		
			 	})
			 })
			/**
			 * Je quitte le chat
			 */

			 socket.on('disconnect',function(){
			 	if(!me){
			 		return false
			 	}
			 	delete users[me.id]
			 	io.sockets.emit('disusr',me)
			 	console.log('Apres une deconnexion')
			 	for(var k in users){
			 		console.log(users[k])
			 	}
			 })
			});

