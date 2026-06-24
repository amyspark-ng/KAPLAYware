export {};

declare global {
	const __GAME_CONFIG__: {
		/** Wheter you should be sent to the DEV scene or not */
		DEV_MICROGAME: string | null;
	};
}
