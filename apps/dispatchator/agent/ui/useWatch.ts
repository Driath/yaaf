import { useEffect } from "react";
import { useStore } from "../../store";

const SYNC_INTERVAL = 2_000; // 2s

export function useWatch() {
	const syncAgentsState = useStore((s) => s.syncAgentsState);

	useEffect(() => {
		const interval = setInterval(syncAgentsState, SYNC_INTERVAL);

		return () => clearInterval(interval);
	}, [syncAgentsState]);
}
