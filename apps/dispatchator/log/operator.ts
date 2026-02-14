import { type OperatorFunction, tap } from "rxjs";
import { useLogStore } from "./store";

export function logEvent<T>(
	source: string,
	action: string,
	detail?: (value: T) => string | undefined,
): OperatorFunction<T, T> {
	return tap((value) => {
		useLogStore
			.getState()
			.log({ type: "event", source, action, detail: detail?.(value) });
	});
}
