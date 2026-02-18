import { claudeProvider } from "./claude";
import { geminiProvider } from "./gemini";
import type { AgentProvider, Provider } from "./types";

const PROVIDERS: Record<Provider, AgentProvider> = {
	claude: claudeProvider,
	gemini: geminiProvider,
};

export function getProvider(name: Provider): AgentProvider {
	const provider = PROVIDERS[name];
	if (!provider) throw new Error(`Unknown provider: ${name}`);
	return provider;
}
