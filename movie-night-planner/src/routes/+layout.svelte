<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authState, loadAuthFromStorage, logout } from '$lib/states/authState.svelte.js';
	import {
		languageState,
		loadLanguageFromStorage,
		setLanguage
	} from '$lib/states/languageState.svelte.js';
	import './layout.css';
	let { children } = $props();

	onMount(() => {
		loadLanguageFromStorage();
		loadAuthFromStorage();
	});

	function handleLogout() {
		logout();
		goto(resolve('/login'));
	}
</script>

{#if authState.isReady}
	<div class="min-h-screen bg-slate-950 text-white">
		<header class="border-b border-slate-800 bg-slate-900/80">
			<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
				<a href={resolve('/')} class="text-xl font-bold tracking-tight"> Movie Night Planner </a>

				<nav class="flex items-center gap-4 text-sm">
					<label class="sr-only" for="language">{languageState.t('app.language')}</label>
					<select
						id="language"
						value={languageState.currentLanguage}
						onchange={(event) => setLanguage(event.currentTarget.value)}
						class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 outline-none hover:border-slate-500 focus:border-indigo-500"
					>
						<option value="de-DE">{languageState.t('app.german')}</option>
						<option value="en-US">{languageState.t('app.english')}</option>
					</select>

					{#if authState.isLoggedIn}
						<a href={resolve('/dashboard')} class="text-slate-300 hover:text-white">
							{languageState.t('app.dashboard')}
						</a>

						<button
							type="button"
							onclick={handleLogout}
							class="rounded-lg bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600"
						>
							{languageState.t('app.logout')}
						</button>
					{:else}
						<a href={resolve('/login')} class="text-slate-300 hover:text-white">
							{languageState.t('app.login')}
						</a>

						<a
							href={resolve('/register')}
							class="rounded-lg bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-600"
						>
							{languageState.t('app.register')}
						</a>
					{/if}
				</nav>
			</div>
		</header>

		<main>
			{@render children()}
		</main>
	</div>
{/if}
