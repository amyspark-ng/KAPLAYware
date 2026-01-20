import { createConductor } from "../../../../conductor";
import { k } from "../../../../kaplay";
import { getKHandled, onPauseChange } from "../../game";
import { MicrogameController } from "../controller";
import { SandboxInstance } from "../instance/instance";
import { Scenery } from "../scenery";

export async function runWinTransition(scenery: Scenery, controller: MicrogameController): Promise<string> {
	return new Promise((resolve) => {
		const instance = new SandboxInstance(scenery);
		const ctx = instance.context;
		const conductor = createConductor(140 * controller.speed);
		const khandled = getKHandled();

		ctx.add([
			ctx.rect(ctx.width(), ctx.height()),
			ctx.color(ctx.mulfok.GREEN),
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

		conductor.onBeat((beat) => {
			khandled.root.bop();
			khandled.antennae.forEach((antenna) => antenna.bop());
			khandled.antennae.forEach((antenna) => antenna.tweak());
			khandled.sideDot.flash(controller.speed, k.mulfok.GREEN);
			const idx = (beat - 1) % 4;
			khandled.dots[idx].flash();

			if (beat == 1) {
				statico.opacity = 0;
			}
			else if (beat == 2) {
				statico.opacity = 1;
			}
		});

		ctx.play("jingle-win").onEnd(() => {
			conductor.destroy();
			instance.root.destroy();
			pauseCheck.cancel();
			resolve("");
		});

		const bean = ctx.add([
			ctx.sprite("bean"),
			ctx.pos(ctx.center()),
			ctx.scale(2),
			ctx.anchor("center"),
		]);
	});
}
