<script lang="ts">
	import router from 'page';
	import { onDestroy, onMount, type Component } from 'svelte';

	import { vault } from '$lib/stores/vault.svelte';

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

	function use(params: UseFnParams) {
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

	function authMiddleware(_ctx: any, next: () => void) {
		if (vault.isUnlocked) next();
		else router.redirect('/login');
	}

	router('/login', (ctx) => {
		use({
			page: import('./(not-authenticated)/login.svelte'),
			pageName: 'login'
		});
		queryParams = ctx.params;
	});

	router('/', authMiddleware, (ctx) => {
		use({
			layout: import('./(authenticated)/route.svelte'),
			layoutName: 'authenticated-layout',
			page: import('./(authenticated)/index.svelte'),
			pageName: 'index'
		});
		queryParams = ctx.params;
	});

	router('/:entryId', authMiddleware, (ctx) => {
		use({
			layout: import('./(authenticated)/route.svelte'),
			layoutName: 'authenticated-layout',
			page: import('./(authenticated)/$entryId.svelte'),
			pageName: 'entry'
		});
		queryParams = ctx.params;
	});

	onMount(() => {
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
