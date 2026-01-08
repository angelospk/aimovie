<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { traktUser } from '$lib/stores/discover';
	import { initiateTraktAuth, exchangeTraktCode } from '$lib/utils/traktApi';
	import { getTraktUser, saveTraktUser, clearTraktUser } from '$lib/utils/localStorage';
	import { Link, Unlink } from 'lucide-svelte';
	import { settings } from '$lib/store.svelte';

	import { browser } from '$app/environment';

	type Language = 'el' | 'en';

	interface TraktTranslations {
		connectedAs: string;
		disconnect: string;
		authenticating: string;
		connect: string;
	}

	const t: Record<Language, TraktTranslations> = {
		el: {
			connectedAs: 'Συνδεδεμένος ως',
			disconnect: 'Αποσύνδεση',
			authenticating: 'Αυθεντικοποίηση με Trakt...',
			connect: 'Σύνδεση με Trakt.tv'
		},
		en: {
			connectedAs: 'Connected as',
			disconnect: 'Disconnect',
			authenticating: 'Authenticating with Trakt...',
			connect: 'Connect to Trakt.tv'
		}
	};

	const tr = $derived(t[settings.lang as Language] ?? t.en);

	let { onUserChange } = $props<{ onUserChange: (user: any) => void }>();

	let isAuthenticating = $state(false);

	if (browser) {
		traktUser.set(getTraktUser());
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code');

		if (code && !$traktUser) {
			isAuthenticating = true;
			exchangeTraktCode(code)
				.then((user) => {
					if (user) {
						saveTraktUser(user);
						traktUser.set(user);
						onUserChange?.(user);
					}
				})
				.catch((error) => {
					console.error('Failed to authenticate with Trakt:', error);
				})
				.finally(() => {
					isAuthenticating = false;
					// Clean up URL
					window.history.replaceState({}, document.title, window.location.pathname);
				});
		}
	}

	function handleConnect() {
		initiateTraktAuth();
	}

	function handleDisconnect() {
		clearTraktUser();
		traktUser.set(null);
		onUserChange(null);
	}

	// TODO: Trakt.tv Connect button is temporarily hidden due to redirect issue
	// when logging in with password without using an account. Needs fixing.
	// The code is preserved - remove the hidden class to re-enable.
	const isTemporarilyHidden = true;
</script>

<!-- TODO: Temporarily hidden - remove 'hidden' class when Trakt redirect issue is fixed -->
<div class="flex items-center justify-center gap-3" class:hidden={isTemporarilyHidden}>
	{#if $traktUser}
		<p class="text-sm text-green-300">{tr.connectedAs} {$traktUser.username}</p>
		<Button onclick={handleDisconnect} variant="destructive" size="sm">
			<Unlink class="w-4 h-4 mr-2" />
			{tr.disconnect}
		</Button>
	{:else if isAuthenticating}
		<p class="text-sm text-purple-300">{tr.authenticating}</p>
	{:else}
		<Button
			onclick={handleConnect}
			variant="outline"
			class="border-purple-400/50 text-purple-200 hover:bg-purple-500/20"
		>
			<Link class="w-4 h-4 mr-2" />
			{tr.connect}
		</Button>
	{/if}
</div>
