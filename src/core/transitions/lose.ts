import { createConductor } from "../../objects/conductor";
import { onPauseChange } from "../../scenes/game";
import { MicrogameController } from "../controller";

// export async function runLoseTransition(scenery: Scenery, controller: MicrogameController): Promise<string> {
// 	return new Promise((resolve) => {
// 		const instance = new SandboxInstance(scenery);
// 		const ctx = instance.context;
// 		const conductor = createConductor(140 * controller.speed);

// 		ctx.add([
// 			ctx.rect(ctx.width(), ctx.height()),
// 			ctx.color(ctx.mulfok.BLUE),
// 		]);

// 		const statico = ctx.add([
// 			ctx.sprite("static", { anim: "a" }),
// 			ctx.scale(2.5),
// 			ctx.z(100),
// 			ctx.opacity(1),
// 		]);

// 		const pauseCheck = onPauseChange((paused) => {
// 			conductor.paused = paused;
// 			// instance.engine.getSoundsPaused() = paused;
// 			instance.root.paused = paused;
// 		});

// 		conductor.onBeat((beat) => {
// 		});

// 		ctx.play("jingle-lose").onEnd(() => {
// 			conductor.destroy();
// 			instance.destroy();
// 			pauseCheck.cancel();
// 			resolve("");
// 		});

// 		const bean = ctx.add([
// 			ctx.sprite("beant"),
// 			ctx.pos(ctx.center()),
// 			ctx.scale(2),
// 			ctx.anchor("center"),
// 		]);
// 	});
// }
