<script>
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { browser } from '$app/environment';
	import { authState } from '$lib/states/authState.svelte.js';
	import { roomApi, movieApi, voteApi } from '$lib/api.js';
	import MovieSearch from '$lib/components/MovieSearch.svelte';

	let room = $state(null);
	let members = $state([]);
	let movies = $state([]);

	let voteResults = $state([]);
	let winners = $state([]);
	let userVote = $state(null);

	let loading = $state(true);
	let moviesLoading = $state(false);
	let resultsLoading = $state(false);
	let votingMovieId = $state(null);
	let closingVoting = $state(false);

	let error = $state('');
	let moviesError = $state('');
	let voteError = $state('');

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
		if (Array.isArray(data)) return data;
		if (Array.isArray(data?.movies)) return data.movies;
		if (Array.isArray(data?.data)) return data.data;
		if (Array.isArray(data?.data?.movies)) return data.data.movies;
		if (Array.isArray(data?.results)) return data.results;
		if (Array.isArray(data?.data?.results)) return data.data.results;

		return [];
	}

	function getVoteResultsFromResponse(data) {
		if (Array.isArray(data)) return data;
		if (Array.isArray(data?.results)) return data.results;
		if (Array.isArray(data?.data?.results)) return data.data.results;

		return [];
	}

	function getWinnersFromResponse(data) {
		if (Array.isArray(data?.winners)) return data.winners;
		if (Array.isArray(data?.data?.winners)) return data.data.winners;

		return [];
	}

	function getUserVoteFromResponse(data) {
		return data?.userVote || data?.data?.userVote || null;
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

	function getMovieId(movie) {
		return movie?.id || movie?.movie_id;
	}

	function idsMatch(a, b) {
		return String(a) === String(b);
	}

	function isRoomOwner() {
		const ownerId = room?.owner_id || room?.ownerId;
		const userId = authState.user?.id;

		return Boolean(ownerId && userId && idsMatch(ownerId, userId));
	}

	function isVotingClosed() {
		return room?.status === 'closed';
	}

	function canCloseVoting() {
		return isRoomOwner() && !isVotingClosed() && getWinnerMovies().length === 1;
	}

	function getVoteCountForMovie(movie) {
		const movieId = getMovieId(movie);

		const result = voteResults.find((item) => {
			const resultMovieId = item.movie_id || item.movieId || item.id;
			return idsMatch(resultMovieId, movieId);
		});

		return Number(result?.votes || result?.vote_count || result?.voteCount || result?.count || 0);
	}

	function getUserVoteMovieId() {
		if (!userVote) return null;

		if (typeof userVote === 'number' || typeof userVote === 'string') {
			return userVote;
		}

		return userVote.movie_id || userVote.movieId || userVote.id || null;
	}

	function isUserVote(movie) {
		const votedMovieId = getUserVoteMovieId();

		if (!votedMovieId) return false;

		return idsMatch(votedMovieId, getMovieId(movie));
	}

	function isWinner(movie) {
		const movieId = getMovieId(movie);

		return winners.some((winner) => {
			if (typeof winner === 'number' || typeof winner === 'string') {
				return idsMatch(winner, movieId);
			}

			const winnerMovieId = winner.movie_id || winner.movieId || winner.id;
			return idsMatch(winnerMovieId, movieId);
		});
	}

	function getWinnerMovies() {
		return movies.filter((movie) => isWinner(movie));
	}

	async function loadRoomPage() {
		loading = true;
		error = '';

		try {
			const data = await roomApi.getRoom(roomId);
			const foundRoom = getRoomFromResponse(data);

			room = foundRoom;
			members = getMembersFromResponse(data, foundRoom);

			await Promise.all([loadMovies(), loadVoteResults()]);
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

	async function loadVoteResults() {
		resultsLoading = true;
		voteError = '';

		try {
			const data = await voteApi.getResults(roomId);

			voteResults = getVoteResultsFromResponse(data);
			winners = getWinnersFromResponse(data);
			userVote = getUserVoteFromResponse(data);
		} catch (err) {
			voteError = err.message;
		} finally {
			resultsLoading = false;
		}
	}

	async function handleMovieAdded() {
		await Promise.all([loadMovies(), loadVoteResults()]);
	}

	async function handleVote(movie) {
		if (isVotingClosed()) {
			voteError = 'Das Voting ist bereits beendet.';
			return;
		}

		const movieId = getMovieId(movie);

		if (!movieId) {
			voteError = 'Für diesen Film wurde keine Movie-ID gefunden.';
			return;
		}

		voteError = '';
		votingMovieId = movieId;

		try {
			await voteApi.voteForMovie(roomId, movieId);
			await loadVoteResults();
		} catch (err) {
			voteError = err.message;
		} finally {
			votingMovieId = null;
		}
	}

	async function handleCloseVoting() {
		if (!canCloseVoting()) return;

		closingVoting = true;
		voteError = '';

		try {
			const data = await roomApi.closeVoting(roomId);
			room = getRoomFromResponse(data);
			await loadVoteResults();
		} catch (err) {
			voteError = err.message;
		} finally {
			closingVoting = false;
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

			{#if getWinnerMovies().length > 0}
				<section class="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
					<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
						<div>
							<p class="text-sm font-medium tracking-wide text-emerald-300 uppercase">
								Aktueller Gewinner
							</p>

							{#if isVotingClosed()}
								<p class="mt-2 text-sm text-emerald-100">Das Voting ist beendet.</p>
							{/if}
						</div>

						{#if canCloseVoting()}
							<button
								type="button"
								onclick={handleCloseVoting}
								disabled={closingVoting}
								class="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{closingVoting ? 'Voting wird beendet...' : 'Voting beenden'}
							</button>
						{/if}
					</div>

					<div class="mt-3 flex flex-wrap gap-3">
						{#each getWinnerMovies() as winnerMovie (winnerMovie.id || winnerMovie.tmdb_id)}
							<div class="rounded-xl bg-slate-950 px-4 py-3">
								<p class="font-semibold text-white">
									🏆 {winnerMovie.title}
								</p>

								<p class="mt-1 text-sm text-emerald-300">
									{getVoteCountForMovie(winnerMovie)}
									{getVoteCountForMovie(winnerMovie) === 1 ? ' Stimme' : ' Stimmen'}
								</p>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<div class="grid gap-6 lg:grid-cols-3">
				<div class="space-y-6 lg:col-span-2">
					<MovieSearch {roomId} language="de-DE" onMovieAdded={handleMovieAdded} />

					<section class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
						<div class="flex items-center justify-between gap-4">
							<div>
								<h2 class="text-xl font-semibold">Film-Vorschläge</h2>
								<p class="mt-2 text-sm text-slate-400">
									{#if isVotingClosed()}
										Das Voting ist beendet. Stimmen koennen nicht mehr geaendert werden.
									{:else}
										Stimme für deinen Favoriten ab. Du kannst deine Stimme jederzeit ändern.
									{/if}
								</p>
							</div>

							<button
								type="button"
								onclick={() => Promise.all([loadMovies(), loadVoteResults()])}
								disabled={moviesLoading || resultsLoading}
								class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{moviesLoading || resultsLoading ? 'Lädt...' : 'Aktualisieren'}
							</button>
						</div>

						{#if moviesError}
							<div
								class="mt-5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
							>
								{moviesError}
							</div>
						{/if}

						{#if voteError}
							<div
								class="mt-5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
							>
								{voteError}
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
									{@const voteCount = getVoteCountForMovie(movie)}
									{@const selectedByUser = isUserVote(movie)}
									{@const winner = isWinner(movie)}

									<article
										class={`flex gap-4 rounded-xl border p-4 ${
											selectedByUser
												? 'border-indigo-500 bg-indigo-500/10'
												: winner
													? 'border-emerald-500/40 bg-emerald-500/10'
													: 'border-slate-800 bg-slate-950'
										}`}
									>
										{#if getPosterUrl(movie.poster_path)}
											<img
												src={getPosterUrl(movie.poster_path)}
												alt={movie.title}
												class="h-36 w-24 rounded-lg object-cover"
											/>
										{:else}
											<div
												class="flex h-36 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs text-slate-500"
											>
												Kein Poster
											</div>
										{/if}

										<div class="min-w-0 flex-1">
											<div
												class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
											>
												<div>
													<div class="flex flex-wrap items-center gap-2">
														<h3 class="font-semibold text-white">
															{movie.title}
														</h3>

														{#if winner}
															<span
																class="rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-300"
															>
																Gewinner
															</span>
														{/if}

														{#if selectedByUser}
															<span
																class="rounded-full bg-indigo-500/20 px-2 py-1 text-xs font-medium text-indigo-300"
															>
																Deine Stimme
															</span>
														{/if}
													</div>

													<p class="mt-1 text-sm text-slate-500">
														{getYear(movie.release_date)}
														{#if movie.rating}
															· Bewertung: {Number(movie.rating).toFixed(1)}
														{/if}
													</p>
												</div>

												<div class="shrink-0 text-left md:text-right">
													<p class="mb-2 text-sm font-medium text-slate-300">
														{voteCount}
														{voteCount === 1 ? ' Stimme' : ' Stimmen'}
													</p>

													<button
														type="button"
														onclick={() => handleVote(movie)}
														disabled={isVotingClosed() || votingMovieId === getMovieId(movie)}
														class={`rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
															selectedByUser
																? 'bg-indigo-500 text-white hover:bg-indigo-600'
																: 'bg-slate-800 text-white hover:bg-slate-700'
														}`}
													>
														{#if isVotingClosed()}
															Voting beendet
														{:else if votingMovieId === getMovieId(movie)}
															Stimme wird gespeichert...
														{:else if selectedByUser}
															Ausgewählt
														{:else}
															Abstimmen
														{/if}
													</button>
												</div>
											</div>

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

				<aside class="space-y-6">
					<section class="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-6">
						<h2 class="text-xl font-semibold">Voting</h2>

						<div class="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
							<p class="text-sm text-slate-400">Deine aktuelle Stimme</p>

							{#if getUserVoteMovieId()}
								<p class="mt-2 font-semibold text-indigo-300">
									{movies.find((movie) => idsMatch(getMovieId(movie), getUserVoteMovieId()))
										?.title || 'Film gewählt'}
								</p>
							{:else}
								<p class="mt-2 text-sm text-slate-500">Du hast noch nicht abgestimmt.</p>
							{/if}
						</div>

						<button
							type="button"
							onclick={loadVoteResults}
							disabled={resultsLoading}
							class="mt-4 w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{resultsLoading ? 'Ergebnisse werden geladen...' : 'Ergebnisse aktualisieren'}
						</button>
					</section>

					<section class="h-fit rounded-2xl border border-slate-800 bg-slate-900 p-6">
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
					</section>
				</aside>
			</div>
		{/if}
	</section>
{/if}
