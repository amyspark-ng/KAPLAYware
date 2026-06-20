import { AudioPlay, GameObj, ScaleComp, TimerComp } from "kaplay";
import { Conductor, createConductor } from "../../objects/conductor";
import { Act, createAct } from "../act/act";
import { MicrogameController } from "../controller";
import { Scenery } from "../scenery";
import { Microgame } from "../microgame";
import { GameAct } from "../act/game_act";

/** It's a function that creates the TRANSITION
 *
 * Creates boiler code that is found on every transition so i don't have to paste it every time
 *
 * The function itself returns a promise so you can know when the transition ends
 */
export function createTransition(
	jingleName: string,
	durationInBeats: number,
	action: (
		/** The act from the transition */
		act: Act,
		/** The game controller, used to get lives and speed */
		controller: MicrogameController,
		conductor: Conductor,
		/** The base parent of the transition, includes timer and scale */
		parent: GameObj<TimerComp | ScaleComp>,
		/** The scenery at which the transition is added to */
		transScenery: Scenery,
		/** The GameAct that includes things like the coming game or the scenery at which is added */
		gameAct: GameAct,
	) => void,
): (transScenery: Scenery, gameAct: GameAct, controller: MicrogameController) => Promise<null> {
	return (transScenery, gameAct, controller) => {
		return new Promise((resolve) => {
			const act = createAct(transScenery);
			const ctx = act.ctx;
			const parent = ctx.add([ctx.timer(), ctx.layer("1"), ctx.scale()]);
			const conductor = createConductor(140 * controller.speed, parent);
			const jingle = ctx.play(jingleName, { speed: controller.speed });
			parent.wait(conductor.beatInterval * durationInBeats, () => {
				conductor.destroy();
				resolve(null);
				// waits a little so you don't notice
				// TODO: fix this
				parent.wait(0.001, () => act.destroy());
			});
			action(act, controller, conductor, parent, transScenery, gameAct);
		});
	};
}
