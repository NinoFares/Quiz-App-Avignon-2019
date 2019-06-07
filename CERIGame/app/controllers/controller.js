function BC_login_controlleur($rootScope,$scope,auth,session){
	/**
	* Traite le formulaire de connexion
	*@returns nothing
	*/
	//Initialisation des variable

	$scope.afficher_login = !auth.isLoggedIn();

	$scope.$on('logout',()=>{
		$scope.afficher_login=true;
	})

	$scope.pseudo = null;
	$scope.password= null;
	$scope.afficher2=false;

	$scope.onClose = function(){
		$scope.afficher2 = false;
	}

	//Fonction pour gerer login dans la page
	$scope.login1 = function(){
	// appel au service d'authentification
		auth.logIn($scope.username,$scope.password).then(function(reponse){
			if (reponse!=null) {
				//Creation de date courante
				var dateH = new Date().toTimeString().slice(0,8);
				var dateD = new Date().toLocaleDateString();
				var dateCourante = dateH+' '+dateD;

				//Verification premiere connexion
				_user = session.getUser();
				if(_user == null){
					session.setUser(reponse.data._id,reponse.data.data,dateCourante,reponse.data.nom,reponse.data.prenom,reponse.data.avatar,reponse.data.date_de_naissance);
					_user = session.getUser();
				}
				date = session.getUser().dateConnex;
				session.setUser(reponse.data._id,reponse.data.data,dateCourante,reponse.data.nom,reponse.data.prenom,reponse.data.avatar,reponse.data.date_de_naissance);
				msg = reponse.data.statusMsg+' '+date;

				$rootScope.$broadcast("logger",{'msg':msg})
				$scope.afficher_login = false;
			}
			else {
				$scope.msg_erreur="Erreur authentification";
				//$scope.afficher2=true;
				const toast = Swal.mixin({
		  			toast: true,
		  			position: 'top',
		  			showConfirmButton: true,
		  			timer: 5000
				});

				toast({
		  		type: 'error',
		  		title: $scope.msg_erreur
				})
			}
		},()=>{console.log("Erreur controlleur");});

	}
		/*socket.on('notification',function(data){
			alert('controleur - socket.on => '+data);
			$scope.bandeauDisplay('Message du serveur '+data);
		});*/
}

function BC_jeu_controlleur($rootScope,$scope,auth,socket,session){

	data ={}
	$scope.afficher_jeu = auth.isLoggedIn();
	if($scope.afficher_jeu){
		$scope.afficher_quiz = true;
		$scope.afficher_profile = false;
		$scope.afficher_classement = false;
	}
	//$scope.afficher=false;

	// $scope.onClose2 = function(){
	// 	$scope.afficher = false;
	// }

	$scope.$on('logger',(event,args)=>{
		$scope.msg_succes = args.msg;
		$scope.afficher_quiz = true;

		const toast = Swal.mixin({
  			toast: true,
  			position: 'top',
  			showConfirmButton: true,
  			timer: 5000
		});

		toast({
  		type: 'success',
  		title: $scope.msg_succes
		})
		//$scope.afficher = true;
		$scope.afficher_jeu = true;
		$scope.afficher_quiz = true;
		$scope.afficher_profile = false;
		$scope.afficher_classement = false;
	})


	$scope.button_quiz = function(){
		$scope.afficher_quiz = true;
		$scope.afficher_profile = false;
		$scope.afficher_classement = false;
	}
	$scope.button_profile = function(){
		$scope.afficher_quiz = false;
		$scope.afficher_profile = true;
		$scope.afficher_classement = false;
		$scope.$broadcast('actualiser_profile');
	}
	$scope.button_classement = function(){
		$scope.afficher_quiz = false;
		$scope.afficher_profile = false;
		$scope.afficher_classement = true;
	}
	$scope.logout = function(){
		auth.logOut();
		$scope.afficher_profile = false;
		$scope.afficher_classement = false;
		$scope.afficher_quiz = false;
		$scope.afficher_jeu=false;
		$rootScope.$broadcast('logout')
	}
}

function BC_profile_controlleur($scope,auth,session,ads){

	function getBase64(file) {
	  	return new Promise((resolve, reject) => {
	    		const reader = new FileReader();
	    		reader.readAsDataURL(file);
	    		reader.onload = () => resolve(reader.result);
	    		reader.onerror = error => reject(error);
	  	});
	}
	function actualisation_Page(){
		data = session.getUser();
		if (data != null){
			$scope.nom = data.nom;
			$scope.prenom=data.prenom;
			$scope.identifiant = data.psd;
			date_modifie =  new Date(data.date_de_naissance).toLocaleDateString();
			$scope.date_de_naissance=date_modifie;
			$scope.avatar = data.avatar;
			$scope.dereniere_connex = data.dateConnex;

			ads.get_hist().then((reponse)=>{
				$scope.result = reponse.data.rows
				$scope.nbr_jeu = reponse.data.rowCount
				$scope.meilleure_score = reponse.data.rows[0].score
			})
		}
	}

	$scope.$on('actualiser_profile',(event,args)=>{
		actualisation_Page();
	})

	$scope.modifier_avatar = function(){
		(async function getImage(){
			const {value: file} = await Swal({
					title: 'Modification avatar profile',
					text: 'Veuillez entrer une photo :',
					type: 'question',
					input: 'file',
					showCancelButton: true,
					inputAttributes: {
					'accept': 'image/*',
					'aria-label': 'Upload your profile picture'
					}
				})
			if (file) {
				const reader = new FileReader
				reader.onload = (e) => {
				  	Swal({
				    		title: 'Your uploaded picture',
				    		imageUrl: e.target.result,
				    		imageAlt: 'The uploaded picture'
				  	})
				  	fichier_img = getBase64(file).then(function(reponse){
				  		ads.setAvatar(reponse).then((reponse)=>{
							if(reponse){
								actualisation_Page();
							}
							else{
								console.log("erreur service setAvatar")
							}
						});
				  	});
				}
				reader.readAsDataURL(file)
			}
		})()
	}

	$scope.modifier_nom = function(){
		(async function getName(){
			const {value: nom} = await Swal({
			  title: 'Modifier le nom',
			  input: 'text',
			  //inputValue: inputValue,
			  showCancelButton: true,
			  inputValidator: (value) => {
			    return !value && 'You need to write something!'
			  }
			})
			const {value: prenom} = await Swal({
			  title: 'Modifier le prenom',
			  input: 'text',
			  //inputValue: inputValue,
			  showCancelButton: true,
			  inputValidator: (value) => {
			    return !value && 'You need to write something!'
			  }
			})
			if (nom && prenom) {
			  Swal(`modifié : ${nom} ${prenom}`)
			  ads.edit_name(nom,prenom).then((reponse)=>{
				  if(reponse){
					  actualisation_Page()
				  }
				  else{
					  console.log("Erreur service edit_name");
				  }
			  })
			}
		})()
	}

	$scope.modifier_date = function(){
		(async function setDate(){
			const {value: date} = await Swal({
			  title: 'Modifier la date de naissance',
			  input: 'date',
			  //inputValue: inputValue,
			  showCancelButton: true,
			  inputValidator: (value) => {
			    return !value && 'You need to write something!'
			  }
			})
		})()
	}
}

function BC_quiz_controlleur($scope,$interval,quizz,auth,ads,socket,session){


	$scope.score = 0
	$scope.themes = []
	$scope.afficher_form_quiz = true;
	$scope.afficher_question = false;
	$scope.afficher_resultat = false;
	$scope.afficher_users_connected = true;
	$scope.afficher_defi_lancee = true;

	if(auth.isLoggedIn()){
		socket.on('users',(args)=>{
			$scope.users_connected = args.data;
		})

		socket.emit('id',{id : session.getID()})
		socket.on('defi',(args2)=>{
			$scope.defis = args2.data
		})
	}

	//Fonction pour gérer le chrono
	chrono = function(){
		if($scope.seconde == 59){
			$scope.seconde = 0
			$scope.minute += 1
		}
		else
			$scope.seconde +=1
	}
	//Fonction pour gérer le button rejouer
	$scope.rejouer = function(){
		$scope.score = 0
		$scope.score_total = 0
		$scope.afficher_form_quiz = true;
		$scope.theme_choisi = null;
		$scope.niveau_choisi = null;
		$scope.afficher_resultat = false;
	}


	themes_id = quizz.reqTheme().then(function(response){
		for (var i=0;i<response.length;i++){
			$scope.themes[i] = response[i].thème;
		}
		return response;
	},(err)=>{console.log("Erreur chargement des themes")});

	$scope.selection_defi = function(defi){
		i = 1;
		$scope.afficher_form_quiz = false;
		$scope.afficher_question = true
		$scope.afficher_resultat = false
		console.log(defi)
		ads.deleteDefi(defi._id);
		gestionJeu(defi.quizz,defi)
	}

	var gestionJeu = function(quiz,defi){
		i = 1 //Variable qui va controler le numero de la question affiché
		// On met le chrono a ZERO
		$scope.seconde = 0
		$scope.minute = 0
		$scope.score_total = 0;
		$scope.score = 0;
		$scope.afficher_users_connected = false;
		$scope.afficher_defi_lancee = false;

		// On lance le chorno
		stop_chrono = $interval(chrono, 1000);
			
			//Fonction qui gére l'affichage des question par rapport a i le numero de la question
			compteur = function(i){
				$scope.question = quiz[i].question;
				$scope.reponses = quiz[i].propositions;
				$scope.reponse_correct = quiz[i].réponse;
			}

			//On définie la fonction qui gére le clique de la réponse
			$scope.onClick = function(choix,reponse){
				if(choix==reponse){
					$scope.score++;
				}
				if(i<5){
					compteur(i)
					i += 1;
				}
				else{
					//Fin du quiz on calcule et affiche le résultat
					$interval.cancel(stop_chrono);
					var tmps_jeu = ($scope.minute * 60) + $scope.seconde;
					var score_total = Math.round(($scope.score * 1398.2)/tmps_jeu);
					$scope.score_total = score_total
					ads.new_hist($scope.score,tmps_jeu,$scope.score_total);
					$scope.afficher_question = false
					$scope.afficher_resultat = true
					$scope.users_defi = false;
					$scope.afficher_users_connected = true;
					$scope.afficher_defi_lancee = true;

					if(defi){
						//TODO : REGLER LE PROBLEME GAGNANT TOUJOURS DEFIANT
						console.log(defi)
						$scope.resultat_defi_score = "Score de "+defi.userDefiantNom+" "+defi.userDefiantPrenom+" : "+defi.userDefiantScore;
						if($scope.score > defi.userDefiantScore){
						$scope.resultat_defi = "Bravo, vous avez gagner le défi de "+defi.userDefiantNom+" "+defi.userDefiantPrenom;
						id_gagnant = defi.userDefiee;
						}
						else if($scope.score == defi.userDefiantScore){
							$scope.resultat_defi = "Egalité parfaite !!"
						}
						else{
							$scope.resultat_defi = "Dommage, "+defi.userDefiantNom+" "+defi.userDefiantPrenom+" vous a battu cette fois, Rententez la prochaine fois ;)"
							id_gagnant = defi.userDefiant;
						}
						ads.setDefiHist(defi.userDefiant,defi.userDefiee,id_gagnant);
						$scope.afficher_button_defi = false;


					}
				
					$scope.defier = function(){
						$scope.afficher_users_defi = true;
						ads.getUsers().then(function(reponse){
						$scope.users =  reponse.data;
						$scope.confirm_defier = function(){
							index = $scope.user_choisi
							Swal(
								'Défis envoyé',
								'Vous venez de défier : '+$scope.users[index].nom+' '+$scope.users[index].prenom
								)
								ads.setDefi($scope.users[index].nom,$scope.users[index].prenom,session.getID(),$scope.users[index].id,$scope.score_total,quiz)
								$scope.afficher_users_defi =false;
							}
						},()=>{
							console.log("Erreur fonction defier");
						});
					}
				}
			}
		var dateA = new Date();
		compteur(0);
		return true;
	}

	// Fonction du boutton jouer pour lancer le quiz
	$scope.jouer = function(){

		if(themes_id.$$state != null)
			themes_id = themes_id.$$state.value;

		// On récupere le thème choisi,son id et le niveau
		theme = $scope.theme_choisi
		niveau = $scope.niveau_choisi;

		// On change le théme par son ID pour faire la requete mongo
		for(var i=0 ;i<themes_id.length;i++){
			if(themes_id[i].thème == theme){
				theme = themes_id[i]._id;
				break;
			}
		}

		// On récupere le quiz par rapport a l'ID du théme
		quizz.reqJeu(theme,niveau).then(function(quiz){

			// On Affiche le quiz
			$scope.afficher_form_quiz = false;
			$scope.afficher_question = true
			$scope.afficher_resultat = false
			gestionJeu(quiz,false)

		},(err)=>(console.log("Erreur, requete non arrivé au controleur "+err)));
		$scope.afficher_button_defi = true;

	}
}

function BC_classement_controlleur(){

}
