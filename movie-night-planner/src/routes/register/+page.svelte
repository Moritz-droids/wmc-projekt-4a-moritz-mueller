<script>
  import { goto } from '$app/navigation';
  import { authApi } from '$lib/api.js';
  import { setAuth } from '$lib/states/authState.svelte.js';
  import { resolve } from '$app/paths';

  let username = $state('');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let error = $state('');
  let loading = $state(false);

  async function handleSubmit(event) {
    event.preventDefault();

    error = '';

    if (!username.trim()) {
      error = 'Bitte gib einen Benutzernamen ein.';
      return;
    }

    if (!email.trim()) {
      error = 'Bitte gib eine E-Mail-Adresse ein.';
      return;
    }

    if (password.length < 6) {
      error = 'Das Passwort muss mindestens 6 Zeichen lang sein.';
      return;
    }

    if (password !== confirmPassword) {
      error = 'Die Passwörter stimmen nicht überein.';
      return;
    }

    loading = true;

    try {
      const data = await authApi.register({
        username,
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
      <h1 class="text-3xl font-bold">Account erstellen</h1>
      <p class="mt-2 text-sm text-slate-400">
        Starte deine erste Movie Night mit Freunden.
      </p>
    </div>

    {#if error}
      <div class="mb-5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error}
      </div>
    {/if}

    <form onsubmit={handleSubmit} class="space-y-5">
      <div>
        <label for="username" class="mb-2 block text-sm font-medium text-slate-300">
          Benutzername
        </label>

        <input
          id="username"
          bind:value={username}
          type="text"
          autocomplete="username"
          class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
          placeholder="moritz"
        />
      </div>

      <div>
        <label for="email" class="mb-2 block text-sm font-medium text-slate-300">
          E-Mail
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
          Passwort
        </label>

        <input
          id="password"
          bind:value={password}
          type="password"
          autocomplete="new-password"
          class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
          placeholder="Mindestens 6 Zeichen"
        />
      </div>

      <div>
        <label for="confirmPassword" class="mb-2 block text-sm font-medium text-slate-300">
          Passwort wiederholen
        </label>

        <input
          id="confirmPassword"
          bind:value={confirmPassword}
          type="password"
          autocomplete="new-password"
          class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
          placeholder="Passwort erneut eingeben"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        class="w-full rounded-lg bg-indigo-500 px-4 py-3 font-semibold text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Account wird erstellt...' : 'Registrieren'}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-slate-400">
      Du hast schon einen Account?
      <a href={resolve('/login')} class="font-medium text-indigo-400 hover:text-indigo-300">
        Einloggen
      </a>
    </p>
  </div>
</section>