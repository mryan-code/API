// Helper to load chalk in CommonJS/ts-node without ERR_REQUIRE_ESM
// Uses dynamic import because chalk v5 is ESM-only
let chalkCache: any = null;
let chalkPromise: Promise<any> | null = null;
// Use native dynamic import to avoid TS transpiling to require() in CJS
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const dynamicImport = new Function("specifier", "return import(specifier);");

async function initChalk(): Promise<void> {
	if (chalkPromise === null) {
		chalkPromise = (dynamicImport("chalk") as Promise<any>).then(module => {
			chalkCache = module.default || module;
			return chalkCache;
		});
	}
	await chalkPromise;
}

function getChalk(): any {
	if (chalkCache === null) {
		// no-op fallback so callers don't crash before initChalk runs
		return {
			red: (text: string) => text,
			green: (text: string) => text,
			blue: (text: string) => text,
			yellow: (text: string) => text,
		};
	}
	return chalkCache;
}

export { initChalk, getChalk };
