<script>
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { browser } from '$app/environment';
	import { authState } from '$lib/states/authState.svelte.js';
	import { roomApi } from '$lib/api.js';

	let room = $state(null);
	let members = $state([]);
	let loading = $state(true);
	let error = $state('');
	let hasLoaded = $state(false);

	const roomId = $derived(page.params.id);

	$effect(() => {
		if (!browser || !authState.isReady) return;

		if (!authState.isLoggedIn) {
			goto(resolve('/login'));
			return;
		}

		if (!hasLoaded && roomId) {
			hasLoaded = true;
			loadRoom();
		}
	});

	function getRoomFromResponse(data) {
		return data?.room || data?.data?.room || data;
	}

	function getMembersFromResponse(data, foundRoom) {
		return data?.members || data?.data?.members || foundRoom?.members || [];
	}

	async function loadRoom() {
		loading = true;
		error = '';

		try {
			const data = await roomApi.getRoom(roomId);
			const foundRoom = getRoomFromResponse(data);

			room = foundRoom;
			members = getMembersFromResponse(data, foundRoom);
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}
</script>

{#if authState.isReady && authState.isLoggedIn}
	<section class="mx-auto max-w-6xl px-4 py-12">
		<div class="mb-8">
			<a
				href={resolve('/dashboard')}
				class="text-sm font-medium text-indigo-400 hover:text-indigo-300"
			>
				← Zurück zum Dashboard
			</a>
		</div>

		{#if loading}
			<div class="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-300">
				Raum wird geladen...
			</div>
		{:else if error}
			<div class="rounded-2xl border border-red-500/40 bg-red-500/10 p-8 text-red-300">
				{error}
			</div>
		{:else if room}
			<div class="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
				<p class="text-sm font-medium tracking-wide text-indigo-400 uppercase">Movie Night Room</p>

				<div class="mt-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
					<div>
						<h1 class="text-4xl font-bold">
							{room.name}
						</h1>

						<p class="mt-3 text-slate-400">
							Status: {room.status || 'open'}
						</p>
					</div>

					{#if room.code}
						<div class="rounded-xl border border-slate-700 bg-slate-950 px-5 py-4 text-center">
							<p class="text-xs font-medium tracking-wide text-slate-400 uppercase">Raumcode</p>

							<p class="mt-1 text-2xl font-bold tracking-widest text-white">
								{room.code}
							</p>
						</div>
					{/if}
				</div>
			</div>

			<div class="grid gap-6 lg:grid-cols-3">
				<section class="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
					<h2 class="text-xl font-semibold">Film-Vorschläge</h2>

					<p class="mt-2 text-sm text-slate-400">
						Hier kommt als Nächstes die Movie Search mit TMDb-Ergebnissen hin.
					</p>

					<div
						class="mt-6 rounded-xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center text-slate-500"
					>
						Noch keine Filme geladen.
					</div>
				</section>

				<aside class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
					<h2 class="text-xl font-semibold">Teilnehmer</h2>

					{#if members.length > 0}
						<ul class="mt-5 space-y-3">
							{#each members as member (member.id)}
								<li class="rounded-lg border border-slate-800 bg-slate-950 px-4 py-3">
									<p class="font-medium">
										{member.username || member.user?.username || 'Unbekannter User'}
									</p>

									{#if member.role}
										<p class="mt-1 text-xs tracking-wide text-slate-500 uppercase">
											{member.role}
										</p>
									{/if}
								</li>
							{/each}
						</ul>
					{:else}
						<p class="mt-4 text-sm text-slate-400">Keine Teilnehmer gefunden.</p>
					{/if}
				</aside>
			</div>
		{/if}
	</section>
{/if}
