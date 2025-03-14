declare global {
	namespace NodeJS {
		interface ProcessEnv {
			TOKEN: string;
			CONNECTION_STRING: string;
			WEATHER_API_KEY: string;
			RAPID_API_KEY: string;
			NODE_ENV: string;
		}
	}
}

export {};