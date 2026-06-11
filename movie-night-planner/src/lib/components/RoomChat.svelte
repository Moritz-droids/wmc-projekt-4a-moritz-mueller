<script>
	import { onDestroy, onMount, tick } from 'svelte';
	import { io } from 'socket.io-client';
	import { authState } from '$lib/states/authState.svelte.js';
	import { languageState } from '$lib/states/languageState.svelte.js';
	import { messageApi } from '$lib/api.js';

	let { roomId } = $props();

	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
	const maxMessageLength = 500;

	let socket = null;
	let messages = $state([]);
	let draft = $state('');
	let loading = $state(true);
	let sending = $state(false);
	let connected = $state(false);
	let joined = $state(false);
	let error = $state('');
	let messagesContainer = $state(null);

	onMount(async () => {
		await loadMessages();
		connectSocket();
	});

	onDestroy(() => {
		if (socket) {
			socket.disconnect();
			socket = null;
		}
	});

	function getMessagesFromResponse(data) {
		if (Array.isArray(data)) return data;
		if (Array.isArray(data?.messages)) return data.messages;
		if (Array.isArray(data?.data)) return data.data;
		if (Array.isArray(data?.data?.messages)) return data.data.messages;

		return [];
	}

	function normalizeMessage(message) {
		return {
			id: message.id,
			room_id: message.room_id || message.roomId,
			user_id: message.user_id || message.userId,
			username: message.username || message.user?.username || languageState.t('room.unknownUser'),
			message: message.message || '',
			created_at: message.created_at || message.createdAt
		};
	}

	function addMessage(message) {
		const normalizedMessage = normalizeMessage(message);

		if (normalizedMessage.id && messages.some((item) => item.id === normalizedMessage.id)) {
			return;
		}

		messages = [...messages, normalizedMessage];
		scrollToBottom();
	}

	function isOwnMessage(message) {
		return String(message.user_id) === String(authState.user?.id);
	}

	function formatTime(dateValue) {
		if (!dateValue) return '';

		const date = new Date(dateValue);

		if (Number.isNaN(date.getTime())) return '';

		return date.toLocaleTimeString('de-DE', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	async function scrollToBottom() {
		await tick();

		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	}

	async function loadMessages() {
		loading = true;
		error = '';

		try {
			const data = await messageApi.getMessages(roomId);
			messages = getMessagesFromResponse(data).map(normalizeMessage);
			await scrollToBottom();
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	function connectSocket() {
		if (!authState.token || socket) return;

		socket = io(API_URL, {
			auth: {
				token: authState.token
			}
		});

		socket.on('connect', () => {
			connected = true;
			joinRoom();
		});

		socket.on('disconnect', () => {
			connected = false;
			joined = false;
		});

		socket.on('connect_error', (err) => {
			error = err.message || languageState.t('chat.errorConnect');
		});

		socket.on('chat:new', (message) => {
			addMessage(message);
		});
	}

	function joinRoom() {
		if (!socket || !connected) return;

		socket.emit('room:join', { roomId: Number(roomId) }, (response) => {
			if (!response?.success) {
				error = response?.error || languageState.t('chat.errorJoin');
				joined = false;
				return;
			}

			error = '';
			joined = true;
		});
	}

	function handleSubmit() {
		const message = draft.trim();

		if (!message || sending || !socket || !joined) return;

		if (message.length > maxMessageLength) {
			error = languageState.t('chat.errorTooLong', { max: maxMessageLength });
			return;
		}

		sending = true;
		error = '';

		socket.emit('chat:send', { roomId: Number(roomId), message }, (response) => {
			sending = false;

			if (!response?.success) {
				error = response?.error || languageState.t('chat.errorSend');
				return;
			}

			draft = '';
		});
	}
</script>

<section class="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-6">
	<div class="flex items-center justify-between gap-4">
		<div>
			<h2 class="text-xl font-semibold">{languageState.t('chat.title')}</h2>
			<p class="mt-1 text-sm text-slate-400">
				{joined
					? languageState.t('chat.connected')
					: connected
						? languageState.t('chat.connecting')
						: languageState.t('chat.offline')}
			</p>
		</div>

		<span
			class={`h-3 w-3 rounded-full ${joined ? 'bg-emerald-400' : connected ? 'bg-amber-400' : 'bg-slate-600'}`}
			aria-label={joined ? languageState.t('chat.connected') : languageState.t('chat.offline')}
		></span>
	</div>

	{#if error}
		<div class="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
			{error}
		</div>
	{/if}

	<div
		bind:this={messagesContainer}
		class="mt-5 flex max-h-80 min-h-64 flex-col gap-3 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-4"
	>
		{#if loading}
			<p class="text-sm text-slate-500">{languageState.t('chat.messagesLoading')}</p>
		{:else if messages.length > 0}
			{#each messages as chatMessage (chatMessage.id)}
				<div class={`flex ${isOwnMessage(chatMessage) ? 'justify-end' : 'justify-start'}`}>
					<div
						class={`max-w-[85%] rounded-xl px-3 py-2 ${
							isOwnMessage(chatMessage)
								? 'bg-indigo-500 text-white'
								: 'border border-slate-800 bg-slate-900 text-slate-100'
						}`}
					>
						<div class="mb-1 flex items-center gap-2 text-xs opacity-80">
							<span class="font-semibold"
								>{isOwnMessage(chatMessage) ? languageState.t('chat.you') : chatMessage.username}</span
							>
							{#if formatTime(chatMessage.created_at)}
								<span>{formatTime(chatMessage.created_at)}</span>
							{/if}
						</div>

						<p class="break-words text-sm leading-5">{chatMessage.message}</p>
					</div>
				</div>
			{/each}
		{:else}
			<p class="text-sm text-slate-500">{languageState.t('chat.noMessages')}</p>
		{/if}
	</div>

	<form class="mt-4 space-y-3" onsubmit={(event) => {
		event.preventDefault();
		handleSubmit();
	}}>
		<textarea
			bind:value={draft}
			maxlength={maxMessageLength}
			rows="3"
			placeholder={languageState.t('chat.placeholder')}
			disabled={!joined || sending}
			class="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
		></textarea>

		<div class="flex items-center justify-between gap-3">
			<p class="text-xs text-slate-500">{draft.length}/{maxMessageLength}</p>

			<button
				type="submit"
				disabled={!joined || sending || draft.trim().length === 0}
				class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{sending ? languageState.t('chat.sending') : languageState.t('chat.send')}
			</button>
		</div>
	</form>
</section>
