import { type Store, useStore } from "./index";

export interface StoreEvent<T> {
	selector: (state: Store) => T;
	predicate: (next: T, prev: T) => boolean;
}

export function defineEvent<T>(
	selector: (state: Store) => T,
	predicate: (next: T, prev: T) => boolean,
): StoreEvent<T> {
	return { selector, predicate };
}

export function on<T>(event: StoreEvent<T>) {
	return {
		subscribe: (action: (next: T, prev: T, store: Store) => void) => {
			return useStore.subscribe(event.selector, (next, prev) => {
				if (event.predicate(next, prev)) {
					action(next, prev, useStore.getState());
				}
			});
		},
	};
}
