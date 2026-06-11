<script>
	import { movieApi } from '$lib/api.js';
	import { languageState } from '$lib/states/languageState.svelte.js';

	let { roomId, onMovieAdded = null } = $props();

	let query = $state('');
	let results = $state([]);
	let loading = $state(false);
	let addingMovieId = $state(null);
	let error = $state('');
	let success = $state('');
	let hasSearched = $state(false);

	function getSearchResults(data) {
		if (Array.isArray(data)) return data;
		if (Array.isArray(data?.results)) return data.results;
		if (Array.isArray(data?.movies)) return data.movies;
		if (Array.isArray(data?.data)) return data.data;
		if (Array.isArray(data?.data?.results)) return data.data.results;
		if (Array.isArray(data?.data?.movies)) return data.data.movies;

		return [];
	}

	function getPosterUrl(posterPath) {
		if (!posterPath) return null;

		if (posterPath.startsWith('http')) {
			return posterPath;
		}

		return `https://image.tmdb.org/t/p/w500${posterPath}`;
	}

	function getYear(releaseDate) {
		if (!releaseDate) return languageState.t('movieSearch.unknownYear');
		return releaseDate.slice(0, 4);
	}

	function normalizeMovie(movie) {
		return {
			tmdb_id: movie.tmdb_id || movie.id,
			title: movie.title,
			original_title: movie.original_title,
			overview: movie.overview,
			poster_path: movie.poster_path,
			release_date: movie.release_date,
			rating: movie.rating || movie.vote_average || 0
		};
	}

	async function handleSearch(event) {
		event.preventDefault();

		error = '';
		success = '';
		hasSearched = true;

		const searchQuery = query.trim();

		if (!searchQuery) {
			error = languageState.t('movieSearch.errorRequired');
			results = [];
			return;
		}

		loading = true;
		results = [];

		try {
			const data = await movieApi.searchMovies(searchQuery, languageState.currentLanguage);
			results = getSearchResults(data);
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function handleAddMovie(movie) {
		error = '';
		success = '';
		addingMovieId = movie.id || movie.tmdb_id;

		try {
			const moviePayload = normalizeMovie(movie);
			const data = await movieApi.addMovieToRoom(roomId, moviePayload);

			success = languageState.t('movieSearch.success', { title: movie.title });

			if (typeof onMovieAdded === 'function') {
				await onMovieAdded(data);
			}
		} catch (err) {
			error = err.message;
		} finally {
			addingMovieId = null;
		}
	}
</script>

<section class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
	<div class="mb-5">
		<h2 class="text-xl font-semibold">{languageState.t('movieSearch.title')}</h2>
		<p class="mt-2 text-sm text-slate-400">{languageState.t('movieSearch.help')}</p>
	</div>

	<form onsubmit={handleSearch} class="flex flex-col gap-3 sm:flex-row">
		<input
			bind:value={query}
			type="text"
			class="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
			placeholder={languageState.t('movieSearch.placeholder')}
		/>

		<button
			type="submit"
			disabled={loading}
			class="rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
		>
			{loading ? languageState.t('movieSearch.searching') : languageState.t('movieSearch.search')}
		</button>
	</form>

	{#if error}
		<div
			class="mt-5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
		>
			{error}
		</div>
	{/if}

	{#if success}
		<div
			class="mt-5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
		>
			{success}
		</div>
	{/if}

	{#if results.length > 0}
		<div class="mt-6 grid gap-4">
			{#each results as movie (movie.id || movie.tmdb_id)}
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
							{languageState.t('room.noPoster')}
						</div>
					{/if}

					<div class="min-w-0 flex-1">
						<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div>
								<h3 class="font-semibold text-white">
									{movie.title}
								</h3>

								<p class="mt-1 text-sm text-slate-500">
									{getYear(movie.release_date)}
									{#if movie.vote_average || movie.rating}
										· {languageState.t('room.rating')}: {(movie.vote_average || movie.rating).toFixed(1)}
									{/if}
								</p>
							</div>

							<button
								type="button"
								onclick={() => handleAddMovie(movie)}
								disabled={addingMovieId === (movie.id || movie.tmdb_id)}
								class="shrink-0 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{addingMovieId === (movie.id || movie.tmdb_id)
									? languageState.t('movieSearch.adding')
									: languageState.t('movieSearch.add')}
							</button>
						</div>

						{#if movie.overview}
							<p class="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
								{movie.overview}
							</p>
						{:else}
							<p class="mt-3 text-sm text-slate-500">{languageState.t('room.noDescription')}</p>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	{:else if hasSearched && !loading && !error}
		<p class="mt-6 text-sm text-slate-500">{languageState.t('movieSearch.noResults')}</p>
	{/if}
</section>
