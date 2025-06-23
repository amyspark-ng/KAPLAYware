import { Microgame } from "../../types/Microgame";
import { getGameDuration } from "./utils";

// export function createPreviewWare() {
// 	const wareApp = createWareApp(true);

// 	return {
// 		containerRoot: wareApp.rootObj,
// 		runGame(microgame: Microgame) {
// 			const ctx = createGameCtx(wareApp, microgame);
// 			ctx.timeLeft = getGameDuration(microgame, ctx);
// 			wareApp.currentContext = ctx;
// 			microgame.start(ctx);
// 		},
// 	};
// }
