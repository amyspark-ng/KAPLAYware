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
		// just in case
		khandled.antennae.forEach((antenna) => antenna.sprite = "consoleantenna");

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

		khandled.root.tween(khandled.root.scale.x, 0.75, 0.75 / controller.speed, (p) => khandled.root.scale.x = p, ctx.easings.easeOutQuint);
		khandled.root.tween(khandled.root.scale.y, 1.1, 0.75 / controller.speed, (p) => khandled.root.scale.y = p, ctx.easings.easeOutQuint);

		function winBop(beat: number) {
			khandled.sideDot.flash(controller.speed, k.mulfok.GREEN);
			const idx = beat % 4;
			khandled.dots[idx].flash();

			if (beat == 1) {
				statico.opacity = 0;
			}
			else if (beat == 2) {
				statico.opacity = 1;
			}
		}

		conductor.onBeat((beat, beatTime) => winBop(beat));

		let hasDepressed = false;
		conductor.onUpdate(() => {
			if (conductor.beatTime >= 1.4 && !hasDepressed) {
				hasDepressed = true;
				khandled.root.tween(khandled.root.scale.x, 1.1, 1 / controller.speed, (p) => khandled.root.scale.x = p, ctx.easings.easeOutQuint);
				khandled.root.tween(khandled.root.scale.y, 0.7, 0.5 / controller.speed, (p) => khandled.root.scale.y = p, ctx.easings.easeOutQuint);
			}
		});

		ctx.play("jingle-win").onEnd(() => {
			conductor.destroy();
			instance.destroy();
			pauseCheck.cancel();
			resolve("");

			khandled.root.tween(khandled.root.scale.x, 1, 0.25 / controller.speed, (p) => khandled.root.scale.x = p, ctx.easings.easeOutQuint);
			khandled.root.tween(khandled.root.scale.y, 1, 0.25 / controller.speed, (p) => khandled.root.scale.y = p, ctx.easings.easeOutQuint);
		});

		const bean = ctx.add([
			ctx.sprite("bean"),
			ctx.pos(ctx.center()),
			ctx.scale(2),
			ctx.anchor("center"),
		]);
	});
}
