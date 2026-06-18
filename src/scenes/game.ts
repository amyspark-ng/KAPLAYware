import { createScenery } from "../core/scenery";
import { createAct } from "../core/act/game_act";
import { k } from "../kaplay";
import { KEvent } from "kaplay";
import { MicrogameController } from "../core/controller";
import { getGame } from "../core/game_registry";

let canPause = true;
let paused = false;
let pauseKEvent: KEvent = new k.KEvent();

export let setCanPause = (newCanPause: boolean) => {
	canPause = newCanPause;
};

export let setPaused = (newPause: boolean) => {
	if (!canPause) return;
	if (paused != newPause) pauseKEvent.trigger(newPause);
	paused = newPause;
};

export let onPauseChange = (action: (paused: boolean) => void) => {
	return pauseKEvent.add(action);
};

let zoomedIn: boolean = true;
export let changeZoom = (newZoom: boolean) => {
	zoomedIn = newZoom;
};

k.scene("game", () => {
	// i would prefer if running a game didn't depend on a controller
	const scenery = createScenery();
	const act = createAct(scenery);
	act.scenery.scale = k.vec2(0.5);

	// const ctx = act.ctx;
	// const bean = ctx.add([
	// 	ctx.sprite("bean"),
	// 	ctx.pos(),
	// 	ctx.area({ cursor: "" }),
	// ]);
	// bean.pos = ctx.vec2(ctx.width() - bean.width, 0);
	// bean.onButtonPress("click", () => {
	// 	if (bean.isHovering()) ctx.debug.log();
	// });

	const controller = new MicrogameController(scenery);
	controller.runGame(getGame("amyspark-ng:get"));
});
