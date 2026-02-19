import { createConductor } from "../../../conductor";
import { k } from "../../../kaplay";
import { SandboxInstance } from "../core/instance/instance";
import { onPauseChange } from "../game";

export function addBomb(instance: SandboxInstance) {
	const ctx = instance.context;

	const BOMB_POS = ctx.vec2(40, ctx.height() - 40);
	let beatsLeft = 3;

	const bomb = instance.root.add([
		ctx.z(9999),
		{
			conductor: createConductor(140, true),
		},
	]);

	const bombSpr = bomb.add([
		ctx.sprite("bomb"),
		ctx.pos(BOMB_POS),
		ctx.anchor("center"),
		ctx.scale(),
		ctx.color(),
		ctx.z(999),
	]);

	const cordstart = bomb.add([
		ctx.sprite("bomb-cord-start"),
		ctx.pos(29, 528),
		ctx.z(998),
	]);

	const cord = bomb.add([
		ctx.sprite("bomb-cord", { tiled: true, width: ctx.width() / 2 }),
		ctx.pos(69, 528),
		ctx.z(998),
	]);

	const cordtip = cord.add([
		ctx.sprite("bomb-cord-tip"),
		ctx.pos(cord.width, 0),
		ctx.anchor("center"),
		ctx.opacity(),
		ctx.z(998),
	]);
	cordtip.pos.y += cordtip.height / 2;

	const fuse = cordtip.add([
		ctx.sprite("bomb-fuse"),
		ctx.pos(0, 22),
		ctx.anchor("center"),
		ctx.scale(),
		ctx.opacity(),
		ctx.z(999),
	]);

	let movingFuse = false;
	bomb.onUpdate(() => {
		if (beatsLeft < -1) return;

		const width = k.lerp(cord.width, ((k.width() / 2) / 3) * beatsLeft, 0.75);
		cord.width = width;
		cordtip.pos.x = width;

		if (beatsLeft == 0 && !movingFuse) {
			if (cordstart.exists()) cordstart.destroy();
			cordtip.opacity = 0;
			movingFuse = true;
			instance.root.tween(fuse.pos.y, fuse.pos.y - 30, bomb.conductor.beatInterval, (p) => fuse.pos.y = p);
		}
	});

	const pauseCheckEv = onPauseChange((paused) => {
		bomb.conductor.paused = paused;
	});

	function destroy() {
		if (bomb.exists()) bomb.destroy();
		bomb.conductor.destroy();
		pauseCheckEv.cancel();
	}

	let hasExploded = false;
	function explode() {
		if (hasExploded) return;
		destroy();
		const kaboom = k.addKaboom(bombSpr.pos, { comps: [k.z(1000)] });
		if (kaboom.exists()) kaboom.parent = instance.root;
		instance.play("bomb-explosion");
		hasExploded = true;
	}

	function tick() {
		if (!bombSpr.exists()) return;
		if (beatsLeft > 0) {
			beatsLeft--;
			const tweenMult = 2 - beatsLeft + 1; // goes from 1 to 3;
			instance.root.tween(ctx.vec2(1).add(0.33 * tweenMult), ctx.vec2(1).add((0.33 * tweenMult) / 2), 0.5 / 3, (p) => bombSpr.scale = p, ctx.easings.easeOutQuint);
			instance.play("bomb-tick", { detune: 25 * 2 - beatsLeft });
			if (beatsLeft == 2) bombSpr.color = ctx.YELLOW;
			else if (beatsLeft == 1) bombSpr.color = ctx.RED.lerp(ctx.YELLOW, 0.5);
			else if (beatsLeft == 0) bombSpr.color = ctx.RED;
		}
		else explode();
	}

	/** Will start a conductor which will explode the bomb in 4 beats (tick, tick, tick, BOOM!) */
	function lit(bpm = 140) {
		bomb.conductor.bpm = bpm;
		bomb.conductor.paused = false;
		bomb.conductor.onBeat((beat, beatTime) => {
			tick();
			if (beat == 4) destroy();
		});
	}

	/** Turns off the bomb */
	function extinguish() {
		// when timeOut and you win, it explodes and since you won it runs extinguish
		// which access fuse, which it shouldn't because when it explodes the parent is destroyed
		if (hasExploded) return;
		bomb.conductor.paused = true;
		fuse.fadeOut(0.5 / 3).onEnd(() => fuse.destroy());
	}

	return {
		destroy,
		lit,
		extinguish,
		explode,

		get conductor() {
			return bomb.conductor;
		},

		get hasExploded() {
			return hasExploded;
		},

		exists() {
			return bomb.exists();
		},
	};
}

export type Bomb = ReturnType<typeof addBomb>;
