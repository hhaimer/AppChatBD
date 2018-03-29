
/* Les variables en dessous sont des variables globaux sur le js */
var express = require('express');
var app = express();

httpServer = require('http').createServer(app).listen(8080),
io = require('socket.io').listen(httpServer),
fs = require('fs');
var mysql = require('mysql')


//Exploitation des fichiers statiques utilisés
app.use(express.static('public'));

// Chargement de la page index.html
app.get('/', function (req, res) {
	res.sendfile(__dirname + '/index.html');
});

var connection = mysql.createConnection({   //connexion à la base de donnée
	host : 'localhost',
	user: 'root',
	password: '',
	database: 'demo'
})

connection.connect(function(err){			//En cas d'erreur dans la connexion à la base de données
	if(err){
		console.log("Connexion echouée")
	}
})

//Tableau des utilisateurs et des messages
var users = {}
var messages = []
var limite = 5

/* io.sockets connection est une variable relative à chaque utilisateur */
/* Côté Serveur */
io.sockets.on('connection', function(socket){ 

	console.log("Nouveau utilisateur")

	var me = false;

	for(var k in users){
		console.log(users[k])            //parcouris tous les utilisateurs deja connecté et les affichés
		socket.emit('newusr',users[k])
	}
	for(var k in messages){			 	 //parcouris tous les messages deja envoyé et les affichés
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
				//Chercher l'utilisateur sur la base de données
			 	connection.query('SELECT * FROM userss WHERE user = ?', [user.username],function(err,rows,fields){
			 		if(err){
			 			socket.emit('error',err)
			 			return false
			 		}

			 		me = {}
			 		me.username = user.username
			 		me.password = user.password
					me.id = user.password
					//si l'utilisateur n'a pas entrer le nom d'utilisateur ou le mot de passe 
			 		if(me.id === ''){
						socket.emit('alerte2',user)
					}else{
						//si un nouveau utilisateur non inscrit sur la base de donnée qui est enregistré
						if(rows.length === 0){

							socket.emit('logged')
							users[me.id]=me
							console.log(me.id)
							io.sockets.emit('newusr',me)
							connection.query('INSERT INTO userss values (?,?,?)',[me.id,me.username,me.password])
   
						}
						else{
							//si le nom d'utilisateur est dejà utilisé, on compare le mot de passe
							connection.query('SELECT * FROM userss WHERE user = ?', [user.username],function(err,rows,fields){
								
								if(err){
									socket.emit('error',err.code)
									return false
								}
								//si l'utilisateur a entré les bons informations
								if(rows[0].pass === me.password){
									var res = rows[0].user; 
									var test = 0;
									//Cherche s'il est deja connecté
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
								//si les informations ne sont pas bonnes	
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

