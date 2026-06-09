import { authState, logout } from '$lib/states/authState.svelte.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function api(path, options = {}) {
	const headers = {
		'Content-Type': 'application/json',
		...options.headers
	};

	if (authState.token) {
		headers.Authorization = `Bearer ${authState.token}`;
	}

	const response = await fetch(`${API_URL}${path}`, {
		...options,
		headers
	});

	const data = await response.json().catch(() => null);

	if (!response.ok) {
		if (response.status === 401) {
			logout();
		}

		throw new Error(data?.message || data?.error || 'Etwas ist schiefgelaufen.');
	}

	return data;
}

export const authApi = {
	register({ username, email, password }) {
		return api('/api/auth/register', {
			method: 'POST',
			body: JSON.stringify({ username, email, password })
		});
	},

	login({ email, password }) {
		return api('/api/auth/login', {
			method: 'POST',
			body: JSON.stringify({ email, password })
		});
	}
};

export const roomApi = {
	createRoom({ name }) {
		return api('/api/rooms', {
			method: 'POST',
			body: JSON.stringify({ name })
		});
	},

	getRoomByCode(code) {
		return api(`/api/rooms/code/${code}`);
	},

	joinRoom(roomId) {
		return api(`/api/rooms/${roomId}/join`, {
			method: 'POST'
		});
	},

	getRoom(roomId) {
		return api(`/api/rooms/${roomId}`);
	}
};
