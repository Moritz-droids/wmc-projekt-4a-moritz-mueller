<script>
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { browser } from '$app/environment';
	import { authState } from '$lib/states/authState.svelte.js';
	import { languageState } from '$lib/states/languageState.svelte.js';
	import { roomApi } from '$lib/api.js';

	let roomName = $state('');
	let roomCode = $state('');

	let createError = $state('');
	let joinError = $state('');
	let createLoading = $state(false);
	let joinLoading = $state(false);

	$effect(() => {
		if (browser && authState.isReady && !authState.isLoggedIn) {
			goto(resolve('/login'));
		}
	});

	function getRoomFromResponse(data) {
		return data?.room || data?.data?.room || data;
	}

	async function handleCreateRoom(event) {
		event.preventDefault();

		createError = '';

		const name = roomName.trim();

		if (!name) {
			createError = languageState.t('dashboard.errorRoomNameRequired');
			return;
		}

		createLoading = true;

		try {
			const data = await roomApi.createRoom({ name });
			const room = getRoomFromResponse(data);
			const roomId = room?.id || data?.roomId || data?.id;

			if (!roomId) {
				throw new Error(languageState.t('dashboard.errorRoomIdMissing'));
			}

			roomName = '';
			goto(resolve('/rooms/[id]', { id: String(roomId) }));
		} catch (err) {
			createError = err.message;
		} finally {
			createLoading = false;
		}
	}

	async function handleJoinRoom(event) {
		event.preventDefault();

		joinError = '';

		const code = roomCode.trim().toUpperCase();

		if (!code) {
			joinError = languageState.t('dashboard.errorRoomCodeRequired');
			return;
		}

		joinLoading = true;

		try {
			const data = await roomApi.getRoomByCode(code);
			const room = getRoomFromResponse(data);
			const roomId = room?.id || data?.roomId || data?.id;

			if (!roomId) {
				throw new Error(languageState.t('dashboard.errorRoomNotFound'));
			}

			await roomApi.joinRoom(roomId);

			roomCode = '';
			goto(resolve('/rooms/[id]', { id: String(roomId) }));
		} catch (err) {
			joinError = err.message;
		} finally {
			joinLoading = false;
		}
	}
</script>

{#if authState.isReady && authState.isLoggedIn}
	<section class="mx-auto max-w-6xl px-4 py-12">
		<div class="mb-10">
			<p class="text-sm font-medium tracking-wide text-indigo-400 uppercase">
				{languageState.t('app.dashboard')}
			</p>

			<h1 class="mt-2 text-4xl font-bold">
				{languageState.t('dashboard.welcome', { username: authState.user.username })}
			</h1>

			<p class="mt-3 max-w-2xl text-slate-400">{languageState.t('dashboard.subtitle')}</p>
		</div>

		<div class="grid gap-6 md:grid-cols-2">
			<form
				onsubmit={handleCreateRoom}
				class="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
			>
				<h2 class="text-xl font-semibold">{languageState.t('dashboard.createRoom')}</h2>

				<p class="mt-2 text-sm text-slate-400">{languageState.t('dashboard.createRoomHelp')}</p>

				{#if createError}
					<div
						class="mt-5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
					>
						{createError}
					</div>
				{/if}

				<div class="mt-5">
					<label for="roomName" class="mb-2 block text-sm font-medium text-slate-300">
						{languageState.t('dashboard.roomName')}
					</label>

					<input
						id="roomName"
						bind:value={roomName}
						type="text"
						class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
						placeholder="Friday Movie Night"
					/>
				</div>

				<button
					type="submit"
					disabled={createLoading}
					class="mt-5 w-full rounded-lg bg-indigo-500 px-4 py-3 font-semibold text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{createLoading
						? languageState.t('dashboard.createLoading')
						: languageState.t('dashboard.createRoom')}
				</button>
			</form>

			<form
				onsubmit={handleJoinRoom}
				class="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
			>
				<h2 class="text-xl font-semibold">{languageState.t('dashboard.joinRoom')}</h2>

				<p class="mt-2 text-sm text-slate-400">{languageState.t('dashboard.joinRoomHelp')}</p>

				{#if joinError}
					<div
						class="mt-5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
					>
						{joinError}
					</div>
				{/if}

				<div class="mt-5">
					<label for="roomCode" class="mb-2 block text-sm font-medium text-slate-300">
						{languageState.t('dashboard.roomCode')}
					</label>

					<input
						id="roomCode"
						bind:value={roomCode}
						type="text"
						class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 tracking-widest text-white uppercase outline-none focus:border-indigo-500"
						placeholder="ABCD12"
					/>
				</div>

				<button
					type="submit"
					disabled={joinLoading}
					class="mt-5 w-full rounded-lg bg-slate-800 px-4 py-3 font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{joinLoading
						? languageState.t('dashboard.joinLoading')
						: languageState.t('dashboard.joinRoom')}
				</button>
			</form>
		</div>
	</section>
{/if}
