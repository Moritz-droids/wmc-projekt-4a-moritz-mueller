<script>
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { browser } from '$app/environment';
	import { authState } from '$lib/states/authState.svelte.js';
	import { roomApi, movieApi } from '$lib/api.js';
	import MovieSearch from '$lib/components/MovieSearch.svelte';

	let room = $state(null);
	let members = $state([]);
	let movies = $state([]);

	let loading = $state(true);
	let moviesLoading = $state(false);
	let error = $state('');
	let moviesError = $state('');
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
			loadRoomPage();
		}
	});

	function getRoomFromResponse(data) {
		return data?.room || data?.data?.room || data;
	}

	function getMembersFromResponse(data, foundRoom) {
		return data?.members || data?.data?.members || foundRoom?.members || [];
	}

	function getMoviesFromResponse(data) {
		return data?.movies || data?.data?.movies || data?.results || data?.data?.results || data || [];
	}

	function getPosterUrl(posterPath) {
		if (!posterPath) return null;

		if (posterPath.startsWith('http')) {
			return posterPath;
		}

		return `https://image.tmdb.org/t/p/w500${posterPath}`;
	}

	function getYear(releaseDate) {
		if (!releaseDate) return 'Unbekannt';
		return releaseDate.slice(0, 4);
	}

	async function loadRoomPage() {
		loading = true;
		error = '';

		try {
			const data = await roomApi.getRoom(roomId);
			const foundRoom = getRoomFromResponse(data);

			room = foundRoom;
			members = getMembersFromResponse(data, foundRoom);

			await loadMovies();
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function loadMovies() {
		moviesLoading = true;
		moviesError = '';

		try {
			const data = await movieApi.getRoomMovies(roomId);
			movies = getMoviesFromResponse(data);
		} catch (err) {
			moviesError = err.message;
		} finally {
			moviesLoading = false;
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
				<div class="space-y-6 lg:col-span-2">
					<MovieSearch {roomId} language="de-DE" onMovieAdded={loadMovies} />

					<section class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
						<div class="flex items-center justify-between gap-4">
							<div>
								<h2 class="text-xl font-semibold">Film-Vorschläge</h2>
								<p class="mt-2 text-sm text-slate-400">
									Alle Filme, die bisher zu diesem Raum hinzugefügt wurden.
								</p>
							</div>

							<button
								type="button"
								onclick={loadMovies}
								disabled={moviesLoading}
								class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{moviesLoading ? 'Lädt...' : 'Aktualisieren'}
							</button>
						</div>

						{#if moviesError}
							<div
								class="mt-5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
							>
								{moviesError}
							</div>
						{/if}

						{#if moviesLoading && movies.length === 0}
							<div
								class="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-8 text-center text-slate-400"
							>
								Filme werden geladen...
							</div>
						{:else if movies.length > 0}
							<div class="mt-6 grid gap-4">
								{#each movies as movie (movie.id || movie.tmdb_id)}
									<article class="flex gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
										{#if getPosterUrl(movie.poster_path)}
											<img
												src={getPosterUrl(movie.poster_path)}
												alt={movie.title}
												class="h-32 w-20 rounded-lg object-cover"
											/>
										{:else}
											<div
												class="flex h-32 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs text-slate-500"
											>
												Kein Poster
											</div>
										{/if}

										<div class="min-w-0 flex-1">
											<h3 class="font-semibold text-white">
												{movie.title}
											</h3>

											<p class="mt-1 text-sm text-slate-500">
												{getYear(movie.release_date)}
												{#if movie.rating}
													· Bewertung: {Number(movie.rating).toFixed(1)}
												{/if}
											</p>

											{#if movie.overview}
												<p class="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
													{movie.overview}
												</p>
											{:else}
												<p class="mt-3 text-sm text-slate-500">Keine Beschreibung verfügbar.</p>
											{/if}
										</div>
									</article>
								{/each}
							</div>
						{:else}
							<div
								class="mt-6 rounded-xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center text-slate-500"
							>
								Noch keine Filme hinzugefügt.
							</div>
						{/if}
					</section>
				</div>

				<aside class="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-6">
					<h2 class="text-xl font-semibold">Teilnehmer</h2>

					{#if members.length > 0}
						<ul class="mt-5 space-y-3">
							{#each members as member (member.id || member.user_id || member.user?.id)}
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
