class PageScrollStore {
	private scrollPositions = new Map<string, number>();

	set(path: string, scrollY: number) {
		this.scrollPositions.set(path, scrollY);
	}

	restore(path: string) {
		if (window.scrollY > 0) return; // Don't restore if user has already scrolled

		const scrollY = this.scrollPositions.get(path) ?? 0;

		window.scrollTo({
			top: scrollY,
			behavior: 'instant'
		});
	}
}

export const pageScroll = new PageScrollStore();
