<script lang="ts">
	import router, { type Context } from 'page';
	import { onDestroy, onMount, type Component } from 'svelte';

	import { vault } from '$lib/stores/vault.svelte';
	import { pageScroll } from '$lib/stores/page-scroll.svelte';

	type PromiseComponent = {
		name: string;
		loader: Component | undefined;
		component: Promise<any>;
	};

	let layout = $state<PromiseComponent | null>(null);
	let page = $state<PromiseComponent | null>(null);
	let queryParams = $state({});

	interface UseFnParams {
		layout?: Promise<any>;
		layoutName?: string;
		layoutLoader?: Component;
		page: Promise<any>;
		pageName: string;
		pageLoader?: Component;
	}

	function use(ctx: Context, params: UseFnParams) {
		queryParams = ctx.params;
		ctx.pagename = params.pageName;

		if (params.layout && params.layoutName) {
			if (params.layoutName !== layout?.name) {
				layout = {
					name: params.layoutName,
					loader: params.layoutLoader,
					component: params.layout
				};
			}
		} else if (layout !== null) {
			layout = null;
		}

		if (params.pageName !== page?.name) {
			page = {
				name: params.pageName,
				loader: params.pageLoader,
				component: params.page
			};
		}
	}

	function authMiddleware(_ctx: Context, next: () => void) {
		if (vault.isUnlocked) next();
		else router.redirect('/login');
	}

	router('/', authMiddleware, () => router.redirect('/entries'));

	router('/entries', authMiddleware, (ctx) =>
		use(ctx, {
			layout: import('./(authenticated)/route.svelte'),
			layoutName: 'authenticated-layout',
			page: import('./(authenticated)/entries.svelte'),
			pageName: 'entries'
		})
	);

	router('/entries/:entryId', authMiddleware, (ctx) =>
		use(ctx, {
			layout: import('./(authenticated)/route.svelte'),
			layoutName: 'authenticated-layout',
			page: import('./(authenticated)/$entryId.svelte'),
			pageName: 'entry'
		})
	);

	router('/login', (ctx) =>
		use(ctx, {
			layout: import('./(not-authenticated)/route.svelte'),
			layoutName: 'not-authenticated-layout',
			page: import('./(not-authenticated)/login.svelte'),
			pageName: 'login'
		})
	);

	router('*', (ctx) =>
		use(ctx, {
			layout: import('./(not-authenticated)/route.svelte'),
			layoutName: 'not-authenticated-layout',
			page: import('./(not-authenticated)/not-found.svelte'),
			pageName: 'not-found'
		})
	);

	router.exit('*', (ctx, next) => {
		pageScroll.set(ctx.pagename, window.scrollY);
		next();
	});

	onMount(() => {
		if ('scrollRestoration' in window.history) {
			window.history.scrollRestoration = 'manual';
		}

		router.start({
			hashbang: true
		});
	});

	onDestroy(() => {
		router.stop();
	});
</script>

{#snippet promiseRenderer(item: PromiseComponent | null, children: PromiseComponent | null)}
	{#if item}
		{#await item.component}
			<item.loader />
		{:then { default: ItemComponent }}
			<ItemComponent {queryParams}>
				{@render promiseRenderer(children, null)}
			</ItemComponent>
		{/await}
	{:else if children}
		{@render promiseRenderer(children, null)}
	{/if}
{/snippet}

{@render promiseRenderer(layout, page)}
