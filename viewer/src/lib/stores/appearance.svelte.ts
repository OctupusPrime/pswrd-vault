class AppearanceStore {
	colorSchema = $state(localStorage.getItem('dark-mode') === 'true' ? 'dark' : 'light');

	changeColorSchema(schema: 'light' | 'dark') {
		this.colorSchema = schema;
		localStorage.setItem('dark-mode', schema === 'dark' ? 'true' : 'false');

		if (schema === 'dark') document.documentElement.classList.add('dark');
		else document.documentElement.classList.remove('dark');
	}

	toggleColorSchema() {
		this.changeColorSchema(this.colorSchema === 'light' ? 'dark' : 'light');
	}
}

export const appearance = new AppearanceStore();
