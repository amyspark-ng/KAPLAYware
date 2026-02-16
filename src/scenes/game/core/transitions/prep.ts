import { createConductor } from "../../../../conductor";
import { getKHandled, onPauseChange } from "../../game";
import { MicrogameController } from "../controller";
import { SandboxInstance } from "../instance/instance";
import { Scenery } from "../scenery";

export async function runPrepTransition(scenery: Scenery, controller: MicrogameController): Promise<string> {
	return new Promise((resolve) => {
		const instance = new SandboxInstance(scenery);
		const ctx = instance.context;
		const conductor = createConductor(140 * controller.speed);
		const khandled = getKHandled();
		// just in case
		khandled.antennae.forEach((antenna) => antenna.sprite = "consoleantenna");

		ctx.add([
			ctx.rect(ctx.width(), ctx.height()),
		]);

		const statico = ctx.add([
			ctx.sprite("static", { anim: "a" }),
			ctx.scale(2.5),
			ctx.z(100),
			ctx.opacity(1),
		]);

		const pauseCheck = onPauseChange((paused) => {
			conductor.paused = paused;
			instance.soundsPaused = paused;
			instance.root.paused = paused;
		});

		ctx.play("jingle-prep").onEnd(() => {
			conductor.destroy();
			instance.destroy();
			pauseCheck.cancel();
			resolve("");
		});

		conductor.onBeat((beat) => {
			khandled.root.bop();
			khandled.antennae.forEach((antenna) => antenna.bop());
			const idx = (beat - 1) % 4;
			khandled.dots[idx].flash();

			if (beat == 1) {
				statico.opacity = 0;
			}
			else if (beat == 2) {
				statico.opacity = 1;
			}
		});

		let promptString = "";
		if (controller.currentGame.hardModeOpt && controller.currentGame.hardModeOpt.prompt) promptString = controller.currentGame.hardModeOpt.prompt;
		else promptString = controller.currentGame.prompt;

		const prompt = ctx.add([
			ctx.text(promptString),
			ctx.pos(ctx.center()),
			ctx.color(ctx.BLACK),
			ctx.scale(2),
			ctx.anchor("center"),
		]);
	});
}
