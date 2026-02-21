class AppearanceStore {
	colorSchema = $state<'system' | 'light' | 'dark'>('system');

	changeColorSchema(schema: 'light' | 'dark') {
		this.colorSchema = schema;

		if (schema === 'dark') document.documentElement.classList.add('dark');
		else document.documentElement.classList.remove('dark');
	}

	toggleColorSchema() {
		const isCurrentlyDark =
			this.colorSchema === 'dark' ||
			(this.colorSchema === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

		this.changeColorSchema(isCurrentlyDark ? 'light' : 'dark');
	}
}

export const appearance = new AppearanceStore();
