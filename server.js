/******** Chargement des Middleware ********/
const express = require('express');
const app = express();
const pgClient = require('pg');
const sha1 = require('sha1');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const bodyParser = require('body-parser');
var dateTime = require('node-datetime');
const fs = require('fs').promises;
var server = require('http').Server(app);
var io = require('socket.io')(server);

/******** Declaration des variables ********/
var   _dirname = '/';
const dsnMongoDB = "mongodb://127.0.0.1:27017/db";
var   responseData = {};
var pool = new pgClient.Pool({user:'root',host:'localhost',database:'etd',port:'5432'});

/******** Configuration du serveur NodeJS - Port : 3202 *********/
app.use(bodyParser.json({limit:'30mb'}));
app.use(bodyParser.urlencoded({ limit:'30mb',extended: true }));
app.use(express.static(_dirname + 'CERIGame/'));
app.use(session({
	secret:'motdepasse',
	saveUninitialized: false,
	resave : false,
	store : new MongoDBStore({
			uri : dsnMongoDB,
			collection: 'mySessions3202',
			touchAfter: 24 * 3600
		}),
	cookie : {maxAge: 24* 3600 * 1000}
}));
server.listen(3202);
/*var server = app.listen(3202,function(){
	console.log('Ecoute dans le port 3202');
});*/
/******** Gestion des URI ********/

app.get('/',function(request,response){
	response.sendFile('CERIGame/index.html',{root:_dirname});
	});


/*****************************		Traitement Login		*****************************/
app.post('/login',function(request,response){
	var psd = request.body.params.username;
	var mdp = request.body.params.password;

	//Requete SQL POSTGRESQL
	sql = "Select * from fredouil.users where identifiant = '"+psd+ "';";

	//Connexion a la base de donnée PSQL

	pool.connect(function(err,client,done){
		if(err){console.log("Error connecting to pg server "+err.stack);}
		else {
			console.log("Connection established with pg db server");
			//Execution de la requete
			client.query(sql, (err, result) => {
				if(err) {console.log('Erreur dexécution de la requete ' + err.stack);}
				//Verification de l'authentification et envoie de donnée
				else if ((result.rows[0] != null) && (result.rows[0].motpasse == sha1(mdp))){

	 				request.session.isConnected = true;
	 				request.session.pseudo = result.rows[0].identifiant;
					request.session.uid = result.rows[0].id;

	 				responseData.isConnected = true;
					responseData._id = result.rows[0].id;
					responseData.data=result.rows[0].identifiant;
					responseData.nom=result.rows[0].nom;
					responseData.prenom=result.rows[0].prenom;
					responseData.date_de_naissance=result.rows[0].date_de_naissance;
					responseData.avatar=result.rows[0].avatar;
	 				responseData.statusMsg='Connexion réussie : bonjour '+result.rows[0].prenom;

					console.log("Connecté");
					console.log('Connexion reussite : '+result.rows[0].nom+' '+result.rows[0].prenom);

 				}
 				else{
					//Authentification incorrecte
					responseData.isConnected=false;
 					console.log('Connexion échouée : informations de connexion incorrecte');
 					responseData.statusMsg=' Connexion échouée : informations de connexion incorrecte';
 				}
				response.send(responseData);
		 	});
			sql = "Update fredouil.users set statut = 1 where id = "+request.session.uid+";";
			client.query(sql, (err, result) => {
				if(err){
					console.log("Erreur lors de l'éxécution de la requete");
				}
				console.log("mise statut a 1")
			});
			client.release();
		}
	},function(err){console.log("Erreur pool")});
});


/*****************************	Récuperation de tout les théme	*****************************/
app.post('/theme',function(request,response){

	MongoClient.connect(dsnMongoDB,{useNewUrlParser:true},function(err,mongoClient){
		if(err){return console.log('ERREUR, Connexion base de données requete quizz')}
		if(mongoClient){

			var reqDB ={};

			mongoClient.db().collection('quizz').find(reqDB,{projection:{thème : 1}}).toArray(function(err,data){

				if(err){return console.log("Erreur, Execution requete mongodb quizz")}
				if(data){
					response.send(data);
					mongoClient.close();
				}
			});
		}
	});
});

/*****************************		Recuperation du quizz		*****************************/
app.post('/quizz',function(request,response){
	theme = request.body.theme;


	MongoClient.connect(dsnMongoDB,{ useNewUrlParser:true },function(err,mongoClient){
		if(err){return console.log('ERREUR, Connexion base de données requete quizz')}
		if(mongoClient){

			var reqDB = {}

			mongoClient.db().collection('quizz').find(reqDB).toArray(function(err,data){
				if(err){return console.log("Erreur, Execution requete mongodb quizz")}
				if(data){
					response.send(data);
					mongoClient.close();
				}
			});
		}
	});
});



/*****************************	Récupération des question d'un théme	*****************************/
app.post('/question',function(request,response){

	theme = request.body.theme;

	MongoClient.connect(dsnMongoDB,{ useNewUrlParser:true },function(err,mongoClient){
		if(err){return console.log('ERREUR, Connexion base de données requete quizz')}
		if(mongoClient){

			theme_id = new ObjectId(theme)
			var reqDB = {_id:ObjectId(theme_id)}

			mongoClient.db().collection('quizz').find(reqDB).toArray(function(err,data){
				if(err){return console.log("Erreur, Execution requete mongodb quizz")}
				if(data){
					response.send(data);
					mongoClient.close();
				}
			});
		}
	});
});


/*****************************		Ménage logout		*****************************/
app.post('/logout',function(request,response){

	sql = "Update fredouil.users set statut = 0 where id = "+request.session.uid+";";

	//Connexion a la base de donnée PSQL

		pool.connect(function(err,client,done){
			if(err){console.log("Error connecting to pg server "+err.stack);}
			else{
				console.log("Connection established with pg db server");
				//Execution de la requete

				client.query(sql, (err, result) => {
					if(err){
						console.log("Erreur lors de l'éxécution de la requete");
					}
					else{
						console.log("mise statut a 0")
						response.send(true);
					}
				});
				client.release();
			}
		});
		request.session = null;
});

/*****************************	Modification des nom et prenom	*****************************/
app.post('/edit_nom',function(request,response){


		console.log("edit_nom = "+request.session.uid);


	sql = "Update fredouil.users set nom = '"+request.body.nom+"', prenom = '"+request.body.prenom+"' where id = "+request.session.uid+";";


	pool.connect(function(err,client,done){
		if(err){console.log("Error connecting to pg server "+err.stack);}
		else{
			client.query(sql,(err,result) =>{
				if(err)console.log("Erreur execution requete "+err)
				else
					console.log("Changement du nom")
					response.send(true);
			});
			client.release();
		}
	});
});

/*****************************	Insertion historique	*****************************/

app.post('/new_hist',function(request,response){

	sql = "insert into fredouil.historique (id_users,date,nbreponse,temps,score) values ("+request.session.uid+",now(),"+request.body.nbr_reponse+","+request.body.temps+","+request.body.score+");";

	pool.connect(function(err,client,done){
		if(err){console.log("Error connecting to pg server "+err.stack);}
		else{
			client.query(sql,(err,result) =>{
				if(err)console.log("Erreur execution requete "+err)
				else
					console.log("insertion historique")
					response.send(true);
			});
			client.release();
		}
	});
});

/*****************************	Affichage historique	*****************************/
app.post('/get_hist',function(request,response){

	sql = " select * from fredouil.historique where id_users = "+request.session.uid+" order by score desc;";

	pool.connect(function(err,client,done){
		if(err){console.log("Error connecting to pg server "+err.stack);}
		else{
			client.query(sql,(err,result) =>{
				if(err)console.log("Erreur execution requete "+err)
				else{
					console.log("affichage historique")
					response.send(result);
				}
			});
			client.release();
		}
	});
});


/*****************************	Changement Avatar	*****************************/

app.post('/setAvatar',async function(request,response){

	img_64 = request.body.img_64
	img = img_64.split(',');
	ext_tmp = img[0].split('/')
	ext = ext_tmp[1].split(';')[0]
	name = 'image_'+(Math.floor(Math.random() * 10))+' '+request.session.uid
	const buff = new Buffer(img[1],'Base64');

	chemin = '/home/nas02a/etudiants/inf/uapv1900550/public_html/'+name+'.'+ext;
	url = 'http://pedago02a.univ-avignon.fr/~uapv1900550/'+name+'.'+ext;
	await fs.writeFile(chemin,buff);

	sql = "update fredouil.users set avatar = '"+url+"' where id = "+request.session.uid+";";

	pool.connect(function(err,client,done){
		if(err){console.log("Error connecting to pg server "+err.stack);}
		else{
			client.query(sql,(err,result) =>{
				if(err)console.log("Erreur execution requete "+err)
				else{
					console.log("Changement avatar");
					response.send(url);
				}
			});
			client.release();
		}
	});
});

/*****************************	Get Users		*****************************/

app.post('/getUsers',function(request,response){

	sql = "select id,nom,prenom,statut from fredouil.users;"

	pool.connect(function(err,client,done){
		if(err){console.log("Error connecting to pg server "+err.stack);}
		else{
			client.query(sql,(err,result) =>{
				if(err)console.log("Erreur execution requete "+err)
				else{
					console.log("Get Users");
					response.send(result.rows);
				}
			});
			client.release();
		}
	});
});

/*****************************	set Defi		*****************************/
app.post('/setDefi',function(request,response){

	nom_defiant = request.body.nom;
	prenom_defiant = request.body.prenom;
	id_defiant = parseInt(request.body.id_defiant,10);
	id_defiee = parseInt(request.body.id_defiee,10);
	score = parseInt(request.body.score,10);
	quiz = request.body.quiz;

	MongoClient.connect(dsnMongoDB,{ useNewUrlParser:true },function(err,mongoClient){
		if(err){return console.log('ERREUR, Connexion base de données requete quizz')}
		if(mongoClient){

			reqDB = {
				userDefiee: id_defiant,
				userDefiant: id_defiant,
				userDefiantNom: nom_defiant,
				userDefiantPrenom: prenom_defiant,
				userDefiantScore: score,
				quizz: quiz
			}
			mongoClient.db().collection('defi').insertOne(reqDB,function(err,data){
					if(err){return console.log("Erreur, Execution requete mongodb quizz")}
					else{
						console.log("Insertion réussite dans mongo");
						response.send(true);
					}
				});
		}
	});
});

/*****************************	Vérification utilisateur connecté	*****************************/
var resultUsers = null;
io.on('connection', function(socket) {
	setInterval(()=>{
		sql = "select * from fredouil.users where statut = 1;";

		pool.connect(function(err,client,done){
			if(err){console.log("Error connecting to pg server "+err.stack);}
			else{
				client.query(sql,(err,result) =>{
					if(err)console.log("Erreur execution requete "+err)
					else{
						resultUsers = result.rows
					}
				});
				client.release();
			}
		});
		socket.emit('users', { data: resultUsers });
	},2000,true);
});

/*****************************	Vérification défi connecté	*****************************/
io.on('connection', function(socket) {
	var uid = null
	var resultDefis = null;
	socket.on('id',(args)=>{
	uid = args.id;
		setInterval(()=>{
			MongoClient.connect(dsnMongoDB,{ useNewUrlParser:true },function(err,mongoClient){
				if(err){return console.log('ERREUR, Connexion base de données requete quizz')}
				if(mongoClient){
					uid = parseInt(uid,10);
						mongoClient.db().collection('defi').find({userDefiee:uid}).toArray(function(err,data){
						if(err){return console.log("Erreur, Execution requete mongodb quizz")}
						if(data){
							resultDefis = data;
							mongoClient.close();
						}
					});
				}
			});
			socket.emit('defi', { data: resultDefis });
		},2000,true);
	});
});

/*****************************	set Defi_historique		*****************************/
app.post('/setDefiHist',function(request,response){

	id_defiant = request.body.id_defiant;
	id_defiee = request.body.id_defiee;
	id_gagnant = request.body.id_gagnant;

	sql = "insert into fredouil.hist_defi (id_users_defiant,id_users_defie,id_users_gagnant,date) values ("+id_defiant+","+id_defiee+","+id_gagnant+",now())"

		pool.connect(function(err,client,done){
			if(err){console.log("Error connecting to pg server "+err.stack);}
			else{
				client.query(sql,(err,result) =>{
					if(err)console.log("Erreur execution requete "+err)
					else{
						response.send(true);
					}
				});
				client.release();
			}
		});
});

/*****************************	delete Defi		*****************************/
app.post('/deleteDefi',function(request,response){

	id_defi = request.body.id_defi

	MongoClient.connect(dsnMongoDB,{ useNewUrlParser:true },function(err,mongoClient){
				if(err){return console.log('ERREUR, Connexion base de données requete quizz')}
				if(mongoClient){

						defi_id = new ObjectId(id_defi)
						var reqDB = {_id:ObjectId(defi_id)}

						mongoClient.db().collection('defi').deleteOne(reqDB,function(err,data){
						if(err){return console.log("Erreur, Execution requete mongodb quizz")}
						if(data){
							console.log("Defi supprimé");
							response.send(true);
							mongoClient.close();
						}
					});
				}
			});

});
