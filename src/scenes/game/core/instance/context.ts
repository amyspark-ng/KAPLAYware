import { KAPLAYCtx } from "kaplay";
import { SandboxInstance } from "./instance";
import { pickKeysInObj } from "../../../../utils";
import { k } from "../../../../kaplay";
import { gameAPIs } from "../../context/api";

/** Modified kaplay context using instance */
export type InstanceContext = Pick<typeof k, typeof gameAPIs[number]>;

export function buildInstanceContext(instance: SandboxInstance): void {
	instance.context = {
		...pickKeysInObj(k, [...gameAPIs]),
		// modified functions
		width: () => k.width(),
		height: () => k.height(),
		center: () => k.vec2(k.width() / 2, k.height() / 2),
		add: (comps) => instance.root.add(comps),
		play: (src, options) => instance.play(src, options),
	};
}
