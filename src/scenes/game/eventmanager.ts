import { AppEventMap, KAPLAYCtx, KEventController, TimerComp } from "kaplay";

type BaseThing = {
	readonly length: number;
	paused: boolean;
	cancelAll(): void;
};

type AppInputEvents = {
	onMouseDown: KAPLAYCtx["onMouseDown"];
	onMousePress: KAPLAYCtx["onMousePress"];
	onMouseRelease: KAPLAYCtx["onMouseRelease"];
	onMouseMove: KAPLAYCtx["onMouseMove"];
	onButtonDown: KAPLAYCtx["onButtonDown"];
	onButtonPress: KAPLAYCtx["onButtonPress"];
	onButtonRelease: KAPLAYCtx["onButtonRelease"];
};

type GeneralEventsManager = {
	add(ev: KEventController): KEventController;
};

export interface EventManager {
	timers: BaseThing & TimerComp;
	inputs: BaseThing & AppInputEvents;
	events: BaseThing & GeneralEventsManager;
	draws: BaseThing & GeneralEventsManager;
}

export function createEventManager(): EventManager {
	return {
		timers: {},
	};
}
