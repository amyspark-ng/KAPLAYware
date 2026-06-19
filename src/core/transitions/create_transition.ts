import { AudioPlay, GameObj, ScaleComp, TimerComp } from "kaplay";
import { Conductor, createConductor } from "../../objects/conductor";
import { createAct, GameAct } from "../act/game_act";
import { MicrogameController } from "../controller";
import { GameScenery } from "../scenery";

/** It's a function that creates the TRANSITION
 *
 * Creates boiler code that is found on every transition so i don't have to paste it every time
 *
 * The function itself returns a promise so you can know when the transition ends
 *
 * The act in the action function is the act of the transition, to access game act use controller.currentAct
 */
export function createTransition(
	jingleName: string,
	durationInBeats: number,
	action: (
		act: GameAct,
		ctx: GameAct["ctx"],
		controller: MicrogameController,
		conductor: Conductor,
		parent: GameObj<TimerComp | ScaleComp>,
		jingle: AudioPlay,
		transScenery: GameScenery,
	) => void,
): (scenery: GameScenery, controller: MicrogameController) => Promise<null> {
	return (scenery, controller) => {
		return new Promise((resolve) => {
			const act = createAct(scenery);
			const ctx = act.ctx;
			const parent = ctx.add([ctx.timer(), ctx.layer("1"), ctx.scale()]);
			const conductor = createConductor(140 * controller.speed, parent);
			const jingle = ctx.play(jingleName, { speed: controller.speed });
			parent.wait(conductor.beatInterval * durationInBeats, () => {
				conductor.destroy();
				act.destroy();
				resolve(null);
			});
			action(act, ctx, controller, conductor, parent, jingle, scenery);
		});
	};
}
