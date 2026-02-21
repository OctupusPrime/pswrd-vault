class EntriesListStore {
	search = $state('');

	resetSearch() {
		this.search = '';
	}

	sortBy = $state<'created-at' | 'updated-at' | 'name'>('created-at');
	sortOrder = $state<'asc' | 'desc'>('asc');

	resetSorting() {
		this.sortBy = 'created-at';
		this.sortOrder = 'asc';
	}
}

export const entriesListStore = new EntriesListStore();
