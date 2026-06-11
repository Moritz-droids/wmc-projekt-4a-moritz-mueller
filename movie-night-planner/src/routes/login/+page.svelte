<script>
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authApi } from '$lib/api.js';
	import { setAuth } from '$lib/states/authState.svelte.js';
	import { languageState } from '$lib/states/languageState.svelte.js';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit(event) {
		event.preventDefault();

		error = '';

		if (!email.trim()) {
			error = languageState.t('auth.errorEmailRequired');
			return;
		}

		if (!password) {
			error = languageState.t('auth.errorPasswordRequired');
			return;
		}

		loading = true;

		try {
			const data = await authApi.login({
				email,
				password
			});

			setAuth(data);
			goto(resolve('/dashboard'));
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}
</script>

<section class="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl items-center justify-center px-4 py-12">
	<div class="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
		<div class="mb-8 text-center">
			<h1 class="text-3xl font-bold">{languageState.t('auth.loginTitle')}</h1>
			<p class="mt-2 text-sm text-slate-400">{languageState.t('auth.loginSubtitle')}</p>
		</div>

		{#if error}
			<div class="mb-5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
				{error}
			</div>
		{/if}

		<form onsubmit={handleSubmit} class="space-y-5">
			<div>
				<label for="email" class="mb-2 block text-sm font-medium text-slate-300">
					{languageState.t('auth.email')}
				</label>

				<input
					id="email"
					bind:value={email}
					type="email"
					autocomplete="email"
					class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
					placeholder="moritz@example.com"
				/>
			</div>

			<div>
				<label for="password" class="mb-2 block text-sm font-medium text-slate-300">
					{languageState.t('auth.password')}
				</label>

				<input
					id="password"
					bind:value={password}
					type="password"
					autocomplete="current-password"
					class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
					placeholder={languageState.t('auth.passwordPlaceholder')}
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full rounded-lg bg-indigo-500 px-4 py-3 font-semibold text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{loading ? languageState.t('auth.loginLoading') : languageState.t('auth.loginTitle')}
			</button>
		</form>

		<p class="mt-6 text-center text-sm text-slate-400">
			{languageState.t('auth.noAccount')}
			<a href={resolve('/register')} class="font-medium text-indigo-400 hover:text-indigo-300">
				{languageState.t('app.register')}
			</a>
		</p>
	</div>
</section>
