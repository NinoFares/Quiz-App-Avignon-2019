// fichier services.js pour définir les services à associer au module dans app.js et à injecter dans le contrôleur si nécessaire
/* service permettant d'accéder aux données par une requête HTTP */

//Fonction pour acceder au donnée session du server
function accessDataService($http,session){

     /**
     * getInfo : la fonction getInfo retourne une promesse provenant du service http
     * @param url
     * @returns {*|Promise}
     */
     this.postinfo = function(url){

       //Appel ajax
       info = $http.get(url,{'username':username,'password':pwd}).then(function(response){return(response.data);},function(reponse){return("WRONG");});
       return info;
     }

     /**
     * Function new_hist envoie une requete au serveur pour insérer une nouvelle ligne dans fredouil.historique
     * @param {nbr_reponse,temps,score}
     * @returns {true}
     */
     this.new_hist = function(nbr_reponse,temps,score){
          var reponse = $http.post('http://pedago02a.univ-avignon.fr:3202/new_hist',{'nbr_reponse': nbr_reponse,'temps': temps, 'score':score}).then(function(reponse){
                    console.log("Historique ajouté");
                    return reponse;
               },function(err){console.log("Erreur insertion historique Function "+err); return null;
          });
          return reponse;
     }

     /**
     * Function get_hist envoie une requete au serveur pour recevoir l'historique de jeu du joueur
     * @param
     * @returns {resultat}
     */
     this.get_hist = function(){
          var reponse = $http.post('http://pedago02a.univ-avignon.fr:3202/get_hist',{}).then(function(resultat){
                    console.log("Historique affiché");
                    return resultat;
               },function(err){console.log("Erreur recuperation historique Function "+err); return null;
          });
          return reponse;
     }

     /**
     * Function edit_name qui modifie le nom et prenom d'utilisateur dans la base de donnée et retourne true si elle a réussi
     * @param {nom,prenom}
     * @returns {true}
     */
     this.edit_name = function(nom,prenom){
          var reponse = $http.post('http://pedago02a.univ-avignon.fr:3202/edit_nom',{'nom':nom, 'prenom': prenom}).then(function(reponse){
                    console.log("Nom modifié");
                    session.setName(nom,prenom)
                    return reponse
               },function(err){console.log("Erreur logIn Function "+err); return null;
          });
          return reponse;
     }

     /**
     * Function setAvatar envoie au serveur l'image en base64 pour l'enregistrer dans le site et la base de donnée
     * @param img_64
     * @returns {true}
     */
     this.setAvatar = function(img_64){
          var reponse = $http.post('http://pedago02a.univ-avignon.fr:3202/setAvatar',{'img_64':img_64}).then(function(reponse){
                    console.log("envoie de l'image");
                    session.setAvatar(reponse.data)
                    return reponse;
               },function(err){console.log("Erreur recuperation historique Function "+err); return null;
          });
          return reponse;
     }
     this.getUsers = function(){
          var reponse = $http.post('http://pedago02a.univ-avignon.fr:3202/getUsers',{}).then(function(reponse){
                    console.log("Get Users");
                    return reponse;
               },function(err){console.log("Erreur recuperation historique Function "+err); return null;
          });
          return reponse;
     }
     this.setDefi = function(nom,prenom,id_defiant,id_defiee,score,quiz){
          var reponse = $http.post('http://pedago02a.univ-avignon.fr:3202/setDefi',{nom:nom,prenom:prenom,id_defiant:id_defiant,id_defiee,score:score,quiz:quiz}).then(function(reponse){
                    console.log("Set defi");
                    return reponse;
               },function(err){console.log("Erreur recuperation historique Function "+err); return null;
          });
          return reponse;
     }

     this.setDefiHist = function(id_defiant,id_defiee,id_gagnant){
          var reponse = $http.post('http://pedago02a.univ-avignon.fr:3202/setDefiHist',{id_defiant:id_defiant,id_defiee:id_defiee,id_gagnant:id_gagnant}).then(function(reponse){
                    console.log("Set Defi Hist");
                    return reponse;
               },function(err){console.log("Erreur insertion defi hist "+err); return null;
          });
          return reponse;
     }

     this.deleteDefi = function(id_defi){
          var reponse = $http.post('http://pedago02a.univ-avignon.fr:3202/deleteDefi',{id_defi:id_defi}).then(function(reponse){
                    console.log("Delete Defi");
                    return reponse;
               },function(err){console.log("Erreur supression defi "+err); return null;
          });
          return reponse;
     }

}

//Fonction gestion des sockets
function treatSocket($rootScope,$interval) {
     var socket = io.connect('http://pedago02a.univ-avignon.fr:3202');

     return {
          on: function (eventName, callback) {
               socket.on(eventName, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                         callback.apply(socket, args);
                    });
               });
          },
          emit: function (eventName, data, callback) {
               socket.emit(eventName, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                         if (callback) {
                              callback.apply(socket, args);
                         }
                    });
               })
          }
     };
}

//Fonction de gestion des session
function sessionService($log){


     /**
     * Function getUser qui permet de retourner les donnée du joueur a partir du LocalStorage
     * @param
     * @returns {Object}
     */
     this.getUser = function(){
          return JSON.parse(localStorage.getItem('session.user'));
     }

     this._user = this.getUser();
     /**
     * Function setUser qui permet d'insérer dans le localStorage les donnée du joueur
     * @param {id,user,date,nom,prenom,avatar,date_de_naissance}
     * @returns
     */
     this.setUser = function(id,user,date,nom,prenom,avatar,date_de_naissance){
          this._user = {
               'id' : id,
               'psd' : user,
               'dateConnex' : date,
               'nom' : nom,
               'prenom' : prenom,
               'avatar' : avatar,
               'date_de_naissance' : date_de_naissance
          }
          localStorage.setItem('session.user', JSON.stringify(this._user));
          return this;
     }

     /**
     * Function setUser qui permet d'insrer un avatar pour un user dans le localStorage
     * @param {avatar}
     * @returns
     */
     this.setAvatar = function(avatar){
          this._user.avatar = avatar
          localStorage.setItem('session.user',JSON.stringify(this._user))
     }

     /**
     * Function setUser qui permet d'insrer un nom et prenom pour un user dans le localStorage
     * @param {nom,prenom}
     * @returns
     */
     this.setName = function(nom,prenom){
          this._user.nom = nom;
          this._user.prenom = prenom;
          localStorage.setItem('session.user',JSON.stringify(this._user))
     }

     /**
     * Function getID qui permet de recuprer l'ID depuis le localStorage
     * @param {}
     * @returns {id}
     */
     this.getID = function(){
          return this._user.id;
     }

     /**
     * Function removeUser qui permet de vider le localStorage
     * @param
     * @returns
     */
     this.removeUser = function(){
          localStorage.clear();
          return this;
     }
}

//Fonction pour gerer l'authentification
function authService($http, session){

     /**
     * Fonction isLoggedIn qui vérifie grace au localStorage si le joueur est connecté ou pas
     * @returns boolean
     */
     this.isLoggedIn = function isLoggedIn(){
          return session.getUser() != null;
     }

     /**
     * Fonction logIn qui envoie au serveur une requete pour vérifié les données utilisitaur si il sont correcte et se connecté si oui
     * @param credentials
     * @returns {*|Promise}
     */
     this.logIn = function(username, password){
          var reponse = $http.post('http://pedago02a.univ-avignon.fr:3202/login',{params:{'username':username, 'password': password}}).then(
               function(response){
                    if(response.data.isConnected){
                         console.log('Connecté message: '+response.data.statusMsg+' objet: '+response.data.data);
				     return response;
                    }
                    else{
                         console.log("Non Connecté");
                         return null;
                    }
               },function(err){console.log("Erreur logIn Function "+err); return null;
          });
          return reponse;
     }

     /**
     * Log out : on peut se poser la question d'une requête HTTP ! pour faire le
     ménage côté serveur ?!
     * @returns {*|Promise}
     */
     //Fonction Logout
     this.logOut = function(){
          session.removeUser();
          $http.post('http://pedago02a.univ-avignon.fr:3202/logout').then(function(response){
          });
    }

}

function gestionQuiz($http){

     /**  Fonction ReqQuiz qui demande au serveur de lui envoyer tout le quiz.
     * @param
     * @returns {*|Promise}
     */
     this.reqQuizAll = function(){
          quiz = $http.post('http://pedago02a.univ-avignon.fr:3202/quizz',{}).then(function(response){
               console.log("Reception requete réussis");
               return response.data;
          },function(err){console.log("Erreur, Res quizz service non réussis")});
          return quiz;
     }

     /**  Fonction ReqQuest qui fais une requete au serveur pour avoir les question d'un théme donnée par rapport a son ID.
     * @param theme
     * @returns {*|Promise}
     */
     this.reqQuest = function(theme){
          console.log("Passage par reqQuest")

          quiz =  $http.post('http://pedago02a.univ-avignon.fr:3202/question',{'theme':theme}).then(function(response){

        console.log("Reception requete réussis");
        return response.data;

      },function(err){console.log("Erreur, Res quizz service non réussis")});
     return quiz;
     }

     /**  Fonction reqJeu qui fais le traitement nécéssaire au question d'un théme donnée et ainsi créer les 5 question du quiz.
     * @param {theme,niveau}
     * @returns {Object}
     */
     this.reqJeu = function(theme,niveau){
          quiz = this.reqQuest(theme).then(function(response){
               quiz = []
               numQuest = []
               quiz

               for(var i=0; i<5; i++){

                    quiz[i] = {}
                    test = 1
                    while(test != -1 ){
                         tmp = Math.floor(Math.random() * 30)
                         test = numQuest.indexOf(tmp)
                    }
                    numQuest[i] = tmp

                    quiz[i].id = response[0].quizz[tmp].id;
                    quiz[i].question = response[0].quizz[tmp].question;
                    quiz[i].réponse = response[0].quizz[tmp].réponse;
                    if(niveau == 4){
                         quiz[i].propositions = response[0].quizz[tmp].propositions;
                    }
                    else{
                         p=false;
                         //While le tableau propositions n'est pas remplie
                         while(!p){
                              //Tableau pour remplir les position des réponse
                              position_tmp = []
                              //tableau temporaire pour les proposition
                              reponse_tmp = []
                              //Variable pour chercher l'occurence d'une position
                              b=0;
                              while(reponse_tmp.length != niveau){
                                   tmpi = Math.floor(Math.random() * 4)
                                   b = position_tmp.indexOf(tmpi)
                                   if(b == -1)
                                   reponse_tmp.push(response[0].quizz[tmp].propositions[tmpi]);
                                   position_tmp.push(tmpi);
                              }
                              //On vérifie si la réponse fait bien partie des propositions
                              b = reponse_tmp.indexOf(response[0].quizz[tmp].réponse)
                              if(b!=-1){
                                   quiz[i].propositions = reponse_tmp
                                   p = true;
                              }
                         }//Si oui on sors de la boucle sinon on re remplie le tableau
                    }
               }
               return quiz;
          },(err)=>{console.log("Erreur ReqJeu")})
          return quiz;
     }

     /**  Fonction reqTheme qui fait une requete au serveur et lui demande seulement les thémes du quiz.
     * @param
     * @returns {Object}
     */
     this.reqTheme = function(){
          console.log("Request Theme")
          themes = $http.post('http://pedago02a.univ-avignon.fr:3202/theme',{}).then(function(response){
               return response.data;
          });
          return themes;
     }

}
