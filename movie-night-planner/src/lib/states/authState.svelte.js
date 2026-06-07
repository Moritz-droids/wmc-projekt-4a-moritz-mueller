import { browser } from '$app/environment';

let user = $state(null);
let token = $state(null);
let isReady = $state(false);

export const authState = {
	get user() {
		return user;
	},

	get token() {
		return token;
	},

	get isReady() {
		return isReady;
	},

	get isLoggedIn() {
		return Boolean(user && token);
	}
};

export function loadAuthFromStorage() {
	if (!browser) return;

	const savedToken = localStorage.getItem('token');
	const savedUser = localStorage.getItem('user');

	if (savedToken && savedUser) {
		token = savedToken;
		user = JSON.parse(savedUser);
	}

	isReady = true;
}

export function setAuth(data) {
	user = data.user;
	token = data.token;

	if (browser) {
		localStorage.setItem('token', data.token);
		localStorage.setItem('user', JSON.stringify(data.user));
	}
}

export function logout() {
	user = null;
	token = null;

	if (browser) {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
	}
}
