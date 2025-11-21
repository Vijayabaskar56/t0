export class SeenSetManager {
	private seen = new Set<string>();

	isSeen(src: string): boolean {
		return this.seen.has(src);
	}

	markSeen(src: string): void {
		this.seen.add(src);
	}

	getSize(): number {
		return this.seen.size;
	}
}
