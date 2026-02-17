import { KAPLAYCtx, Vec2 } from "kaplay";
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
		add: (comps) => instance.root.add(comps),
		play: (src, options) => instance.play(src, options),
		get: (tag, opts) => instance.root.get(tag, opts),

		opacity(o) {
			const comp = k.opacity(o);
			return {
				...comp,
				fadeOut(time: number, easeFunc = k.easings.linear) {
					return instance.root.tween(
						this.opacity,
						0,
						time,
						(a) => this.opacity = a,
						easeFunc,
					);
				},
				fadeIn(time: number, easeFunc = k.easings.linear) {
					return instance.root.tween(
						0,
						this.opacity,
						time,
						(a) => this.opacity = a,
						easeFunc,
					);
				},
			};
		},

		getCamRot: () => instance.camera.angle,
		setCamRot: (val: number) => instance.camera.angle = val,
		getCamPos: () => instance.camera.pos,
		setCamPos: (val) => instance.camera.pos = k.vec2(val),
		getCamScale: () => instance.camera.scale,
		setCamScale: (val) => instance.camera.scale = k.vec2(val),
		shake: (val: number = 12) => instance.camera.shake += val,
		addConfetti: (opt) => {
			const confetti = k.addConfetti(opt);
			if (instance.root.exists()) confetti.parent = instance.root;
			else confetti.destroy();
			return confetti;
		},
	};
}
