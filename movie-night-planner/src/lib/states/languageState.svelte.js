import { browser } from '$app/environment';

const STORAGE_KEY = 'language';

let currentLanguage = $state('de-DE');
let isReady = $state(false);

const translations = {
	'de-DE': {
		'app.dashboard': 'Dashboard',
		'app.login': 'Login',
		'app.logout': 'Logout',
		'app.register': 'Registrieren',
		'app.language': 'Sprache',
		'app.german': 'Deutsch',
		'app.english': 'Englisch',
		'auth.loginTitle': 'Einloggen',
		'auth.loginSubtitle': 'Weiter zu deinen Movie-Night-Raeumen.',
		'auth.email': 'E-Mail',
		'auth.password': 'Passwort',
		'auth.passwordPlaceholder': 'Dein Passwort',
		'auth.loginLoading': 'Login laeuft...',
		'auth.noAccount': 'Noch keinen Account?',
		'auth.createAccountTitle': 'Account erstellen',
		'auth.registerSubtitle': 'Starte deine erste Movie Night mit Freunden.',
		'auth.username': 'Benutzername',
		'auth.passwordMinPlaceholder': 'Mindestens 6 Zeichen',
		'auth.confirmPassword': 'Passwort wiederholen',
		'auth.confirmPasswordPlaceholder': 'Passwort erneut eingeben',
		'auth.registerLoading': 'Account wird erstellt...',
		'auth.hasAccount': 'Du hast schon einen Account?',
		'auth.errorEmailRequired': 'Bitte gib deine E-Mail-Adresse ein.',
		'auth.errorPasswordRequired': 'Bitte gib dein Passwort ein.',
		'auth.errorUsernameRequired': 'Bitte gib einen Benutzernamen ein.',
		'auth.errorPasswordLength': 'Das Passwort muss mindestens 6 Zeichen lang sein.',
		'auth.errorPasswordsMismatch': 'Die Passwoerter stimmen nicht ueberein.',
		'dashboard.welcome': 'Willkommen, {username}',
		'dashboard.subtitle':
			'Erstelle einen neuen Movie-Night-Raum oder tritt einem bestehenden Raum per Code bei.',
		'dashboard.createRoom': 'Raum erstellen',
		'dashboard.createRoomHelp':
			'Erstelle einen neuen Raum und lade deine Freunde spaeter per Code ein.',
		'dashboard.roomName': 'Raumname',
		'dashboard.createLoading': 'Raum wird erstellt...',
		'dashboard.joinRoom': 'Raum beitreten',
		'dashboard.joinRoomHelp': 'Gib den Raumcode ein, den du von einem Freund bekommen hast.',
		'dashboard.roomCode': 'Raumcode',
		'dashboard.joinLoading': 'Beitritt laeuft...',
		'dashboard.errorRoomNameRequired': 'Bitte gib einen Raumnamen ein.',
		'dashboard.errorRoomIdMissing':
			'Der Raum wurde erstellt, aber es wurde keine Raum-ID zurueckgegeben.',
		'dashboard.errorRoomCodeRequired': 'Bitte gib einen Raumcode ein.',
		'dashboard.errorRoomNotFound': 'Es wurde kein Raum mit diesem Code gefunden.',
		'room.back': 'Zurueck zum Dashboard',
		'room.loading': 'Raum wird geladen...',
		'room.status': 'Status: {status}',
		'room.code': 'Raumcode',
		'room.currentWinner': 'Aktueller Gewinner',
		'room.votingClosed': 'Das Voting ist beendet.',
		'room.closeVoting': 'Voting beenden',
		'room.closingVoting': 'Voting wird beendet...',
		'room.voteSingular': 'Stimme',
		'room.votePlural': 'Stimmen',
		'room.movieSuggestions': 'Film-Vorschlaege',
		'room.votingClosedLong':
			'Das Voting ist beendet. Stimmen koennen nicht mehr geaendert werden.',
		'room.voteHelp':
			'Stimme fuer deinen Favoriten ab. Du kannst deine Stimme jederzeit aendern.',
		'room.refresh': 'Aktualisieren',
		'room.loadingShort': 'Laedt...',
		'room.moviesLoading': 'Filme werden geladen...',
		'room.noMovies': 'Noch keine Filme hinzugefuegt.',
		'room.winner': 'Gewinner',
		'room.yourVoteBadge': 'Deine Stimme',
		'room.rating': 'Bewertung',
		'room.noPoster': 'Kein Poster',
		'room.noDescription': 'Keine Beschreibung verfuegbar.',
		'room.vote': 'Abstimmen',
		'room.selected': 'Ausgewaehlt',
		'room.savingVote': 'Stimme wird gespeichert...',
		'room.votingEnded': 'Voting beendet',
		'room.voting': 'Voting',
		'room.yourCurrentVote': 'Deine aktuelle Stimme',
		'room.movieSelected': 'Film gewaehlt',
		'room.noVoteYet': 'Du hast noch nicht abgestimmt.',
		'room.resultsLoading': 'Ergebnisse werden geladen...',
		'room.refreshResults': 'Ergebnisse aktualisieren',
		'room.participants': 'Teilnehmer',
		'room.unknownUser': 'Unbekannter User',
		'room.noParticipants': 'Keine Teilnehmer gefunden.',
		'room.addClosed': 'Das Voting ist beendet. Es koennen keine weiteren Filme hinzugefuegt werden.',
		'room.errorVotingClosed': 'Das Voting ist bereits beendet.',
		'room.errorMovieIdMissing': 'Fuer diesen Film wurde keine Movie-ID gefunden.',
		'movieSearch.title': 'Film suchen',
		'movieSearch.help': 'Suche nach Filmen und fuege sie als Vorschlag zu diesem Raum hinzu.',
		'movieSearch.placeholder': 'z.B. Interstellar',
		'movieSearch.search': 'Suchen',
		'movieSearch.searching': 'Suche...',
		'movieSearch.add': 'Hinzufuegen',
		'movieSearch.adding': 'Wird hinzugefuegt...',
		'movieSearch.errorRequired': 'Bitte gib einen Filmtitel ein.',
		'movieSearch.success': '"{title}" wurde zum Raum hinzugefuegt.',
		'movieSearch.noResults': 'Keine Suchergebnisse gefunden.',
		'movieSearch.unknownYear': 'Unbekannt',
		'chat.title': 'Chat',
		'chat.connected': 'Live verbunden',
		'chat.connecting': 'Raum wird verbunden...',
		'chat.offline': 'Offline',
		'chat.messagesLoading': 'Nachrichten werden geladen...',
		'chat.noMessages': 'Noch keine Nachrichten.',
		'chat.you': 'Du',
		'chat.placeholder': 'Nachricht schreiben...',
		'chat.send': 'Senden',
		'chat.sending': 'Sendet...',
		'chat.errorTooLong': 'Nachrichten duerfen maximal {max} Zeichen lang sein.',
		'chat.errorConnect': 'Socket-Verbindung fehlgeschlagen.',
		'chat.errorJoin': 'Raum konnte nicht betreten werden.',
		'chat.errorSend': 'Nachricht konnte nicht gesendet werden.'
	},
	'en-US': {
		'app.dashboard': 'Dashboard',
		'app.login': 'Login',
		'app.logout': 'Logout',
		'app.register': 'Register',
		'app.language': 'Language',
		'app.german': 'German',
		'app.english': 'English',
		'auth.loginTitle': 'Log in',
		'auth.loginSubtitle': 'Continue to your movie-night rooms.',
		'auth.email': 'Email',
		'auth.password': 'Password',
		'auth.passwordPlaceholder': 'Your password',
		'auth.loginLoading': 'Logging in...',
		'auth.noAccount': 'No account yet?',
		'auth.createAccountTitle': 'Create account',
		'auth.registerSubtitle': 'Start your first movie night with friends.',
		'auth.username': 'Username',
		'auth.passwordMinPlaceholder': 'At least 6 characters',
		'auth.confirmPassword': 'Repeat password',
		'auth.confirmPasswordPlaceholder': 'Enter password again',
		'auth.registerLoading': 'Creating account...',
		'auth.hasAccount': 'Already have an account?',
		'auth.errorEmailRequired': 'Please enter your email address.',
		'auth.errorPasswordRequired': 'Please enter your password.',
		'auth.errorUsernameRequired': 'Please enter a username.',
		'auth.errorPasswordLength': 'The password must be at least 6 characters long.',
		'auth.errorPasswordsMismatch': 'The passwords do not match.',
		'dashboard.welcome': 'Welcome, {username}',
		'dashboard.subtitle': 'Create a new movie-night room or join an existing room with a code.',
		'dashboard.createRoom': 'Create room',
		'dashboard.createRoomHelp': 'Create a new room and invite your friends later with a code.',
		'dashboard.roomName': 'Room name',
		'dashboard.createLoading': 'Creating room...',
		'dashboard.joinRoom': 'Join room',
		'dashboard.joinRoomHelp': 'Enter the room code you got from a friend.',
		'dashboard.roomCode': 'Room code',
		'dashboard.joinLoading': 'Joining...',
		'dashboard.errorRoomNameRequired': 'Please enter a room name.',
		'dashboard.errorRoomIdMissing': 'The room was created, but no room ID was returned.',
		'dashboard.errorRoomCodeRequired': 'Please enter a room code.',
		'dashboard.errorRoomNotFound': 'No room was found for this code.',
		'room.back': 'Back to dashboard',
		'room.loading': 'Loading room...',
		'room.status': 'Status: {status}',
		'room.code': 'Room code',
		'room.currentWinner': 'Current winner',
		'room.votingClosed': 'Voting is closed.',
		'room.closeVoting': 'Close voting',
		'room.closingVoting': 'Closing voting...',
		'room.voteSingular': 'vote',
		'room.votePlural': 'votes',
		'room.movieSuggestions': 'Movie suggestions',
		'room.votingClosedLong': 'Voting is closed. Votes can no longer be changed.',
		'room.voteHelp': 'Vote for your favorite. You can change your vote anytime.',
		'room.refresh': 'Refresh',
		'room.loadingShort': 'Loading...',
		'room.moviesLoading': 'Loading movies...',
		'room.noMovies': 'No movies added yet.',
		'room.winner': 'Winner',
		'room.yourVoteBadge': 'Your vote',
		'room.rating': 'Rating',
		'room.noPoster': 'No poster',
		'room.noDescription': 'No description available.',
		'room.vote': 'Vote',
		'room.selected': 'Selected',
		'room.savingVote': 'Saving vote...',
		'room.votingEnded': 'Voting closed',
		'room.voting': 'Voting',
		'room.yourCurrentVote': 'Your current vote',
		'room.movieSelected': 'Movie selected',
		'room.noVoteYet': 'You have not voted yet.',
		'room.resultsLoading': 'Loading results...',
		'room.refreshResults': 'Refresh results',
		'room.participants': 'Participants',
		'room.unknownUser': 'Unknown user',
		'room.noParticipants': 'No participants found.',
		'room.addClosed': 'Voting is closed. No more movies can be added.',
		'room.errorVotingClosed': 'Voting is already closed.',
		'room.errorMovieIdMissing': 'No movie ID was found for this movie.',
		'movieSearch.title': 'Search movie',
		'movieSearch.help': 'Search for movies and add them as suggestions to this room.',
		'movieSearch.placeholder': 'e.g. Interstellar',
		'movieSearch.search': 'Search',
		'movieSearch.searching': 'Searching...',
		'movieSearch.add': 'Add',
		'movieSearch.adding': 'Adding...',
		'movieSearch.errorRequired': 'Please enter a movie title.',
		'movieSearch.success': '"{title}" was added to the room.',
		'movieSearch.noResults': 'No search results found.',
		'movieSearch.unknownYear': 'Unknown',
		'chat.title': 'Chat',
		'chat.connected': 'Live connected',
		'chat.connecting': 'Joining room...',
		'chat.offline': 'Offline',
		'chat.messagesLoading': 'Loading messages...',
		'chat.noMessages': 'No messages yet.',
		'chat.you': 'You',
		'chat.placeholder': 'Write a message...',
		'chat.send': 'Send',
		'chat.sending': 'Sending...',
		'chat.errorTooLong': 'Messages must not be longer than {max} characters.',
		'chat.errorConnect': 'Socket connection failed.',
		'chat.errorJoin': 'Could not join room.',
		'chat.errorSend': 'Message could not be sent.'
	}
};

function interpolate(text, values = {}) {
	return Object.entries(values).reduce((result, [key, value]) => {
		return result.replaceAll(`{${key}}`, value);
	}, text);
}

function translate(key, values = {}) {
	const dictionary = translations[currentLanguage] || translations['de-DE'];
	const text = dictionary[key] || translations['de-DE'][key] || key;

	return interpolate(text, values);
}

export const languageState = {
	get currentLanguage() {
		return currentLanguage;
	},

	get isReady() {
		return isReady;
	},

	t: translate
};

export function loadLanguageFromStorage() {
	if (browser) {
		const savedLanguage = localStorage.getItem(STORAGE_KEY);

		if (savedLanguage && translations[savedLanguage]) {
			currentLanguage = savedLanguage;
		}
	}

	isReady = true;
}

export function setLanguage(language) {
	if (!translations[language]) return;

	currentLanguage = language;

	if (browser) {
		localStorage.setItem(STORAGE_KEY, language);
	}
}
