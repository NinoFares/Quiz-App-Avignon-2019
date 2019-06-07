// Angular
var jeuBC = angular.module('jeuBC',[]);

// Controlleurs
jeuBC.controller('BC_login_controlleur',BC_login_controlleur);
jeuBC.controller('BC_jeu_controlleur',BC_jeu_controlleur);
jeuBC.controller('BC_profile_controlleur',BC_profile_controlleur);
jeuBC.controller('BC_quiz_controlleur',BC_quiz_controlleur);
jeuBC.controller('BC_classement_controlleur',BC_classement_controlleur);

// Services
jeuBC.service('ads',accessDataService);
jeuBC.service('auth',authService);
jeuBC.service('session',sessionService);
jeuBC.service('quizz',gestionQuiz);
jeuBC.service('socket', treatSocket);
