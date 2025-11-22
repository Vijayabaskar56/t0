export class SeenSetManager {
	private seen = new Set<string>();
	private maxSize = 1000;
	private insertionOrder: string[] = [];

	isSeen(src: string): boolean {
		return this.seen.has(src);
	}

	markSeen(src: string): void {
		if (!this.seen.has(src)) {
			this.seen.add(src);
			this.insertionOrder.push(src);

			// LRU eviction when size exceeds limit
			if (this.seen.size > this.maxSize) {
				const oldest = this.insertionOrder.shift();
				if (oldest) {
					this.seen.delete(oldest);
				}
			}
		}
	}

	getSize(): number {
		return this.seen.size;
	}

	clear(): void {
		this.seen.clear();
		this.insertionOrder = [];
	}
}
