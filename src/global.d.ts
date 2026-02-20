export {};

declare global {
	const __GAME_CONFIG__: {
		DEV_MICROGAME: string | null;
		DEV_SPEED: number;
		DEV_HARD: boolean;
	};
}
