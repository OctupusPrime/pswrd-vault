class EntriesListStore {
	search = $state('');

	clearFilters() {
		this.search = '';
	}
}

export const entriesListStore = new EntriesListStore();
