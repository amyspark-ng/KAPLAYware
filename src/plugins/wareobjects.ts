import { Color, GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import k from "../engine";
import { getGameInput } from "../game/utils";
import { WareApp } from "../game/kaplayware";

function addPrompt(wareApp: WareApp, promptText: string) {
	const promptObj = wareApp.WareScene.add([
		k.color(k.WHITE),
		k.fixed(),
		k.text(`[a]${promptText}[/a]`, {
			align: "center",
			size: 100,
			styles: {
				"a": {
					pos: k.vec2(),
				},
			},
		}),
		k.pos(k.center()),
		k.anchor("center"),
		k.scale(),
		k.opacity(),
		k.z(101),
		{
			/** Set this to true if you wish for the object to not use the default animation */
			overrideAnimation: false,
			end() {
			},
		},
	]);

	if (promptObj.overrideAnimation == false) {
		// the shaky letters
		let magnitude = 0;
		let angle = 0;
		promptObj.onUpdate(() => {
			magnitude = k.lerp(magnitude, k.randi(2, 8), 0.1);
			angle = k.lerp(angle, angle + 1, 0.1) % 360;
			promptObj.textTransform = (idx, ch) => ({
				pos: k.vec2(magnitude * Math.cos(angle * ((idx % 2) + 1) + 1), magnitude * Math.sin(angle * ((idx % 2) + 1) + 1)),
			});
		});

		// the jumpy
		wareApp.pausableCtx.tween(0, 1.2, 0.25 / wareApp.wareCtx.speed, (p) => promptObj.scale.x = p, k.easings.easeOutExpo);
		wareApp.pausableCtx.tween(0, 0.9, 0.25 / wareApp.wareCtx.speed, (p) => promptObj.scale.y = p, k.easings.easeOutExpo).onEnd(() => {
			wareApp.pausableCtx.tween(promptObj.scale, k.vec2(1), 0.25 * 1.1, (p) => promptObj.scale = p, k.easings.easeOutElastic).onEnd(() => {
			});
		});

		promptObj.end = () => {
			// can't use fade out because it's not paused lol
			wareApp.pausableCtx.tween(promptObj.opacity, 0, 0.25 / wareApp.wareCtx.speed, (p) => promptObj.opacity = p).onEnd(() => promptObj.destroy());
		};
	}

	return promptObj;
}

function addInputPrompt(wareApp: WareApp, input: ReturnType<typeof getGameInput>) {
	const prompt = wareApp.WareScene.add([{
		end() {},
	}]);

	const inputBg = prompt.add([
		k.sprite("input-circle"),
		k.scale(),
		k.pos(k.center()),
		k.rotate(),
		k.anchor("center"),
	]);

	const inputPrompt = prompt.add([
		k.sprite("input-" + input),
		k.anchor("center"),
		k.pos(k.center()),
		k.scale(),
	]);

	prompt.onUpdate(() => {
		inputBg.angle += 0.1 * wareApp.wareCtx.speed;
	});
	wareApp.pausableCtx.tween(k.vec2(0), k.vec2(1), 0.25 / wareApp.wareCtx.speed, (p) => inputBg.scale = p, k.easings.easeOutExpo);
	wareApp.pausableCtx.tween(k.vec2(0), k.vec2(1), 0.25 / wareApp.wareCtx.speed, (p) => inputPrompt.scale = p, k.easings.easeOutElastic);

	prompt.end = () => {
		const tween = wareApp.pausableCtx.tween(k.vec2(1), k.vec2(0), 0.25 / wareApp.wareCtx.speed, (p) => inputBg.scale = p, k.easings.easeOutExpo);
		tween.onEnd(() => {
			prompt.destroy();
		});
		return tween;
	};
	return prompt;
}

export type WareBomb = GameObj<{ tick(): void; beatsLeft: number; turnOff(): void; explode(): void; hasExploded: boolean; lit(bpm?: number): void; }>;

function addBomb(wareApp: WareApp): WareBomb {
	const BOMB_POS = k.vec2(40, k.height() - 40);
	let beatsLeft = 3;

	const bomb = wareApp.WareScene.add([{
		tick,
		get hasExploded() {
			return hasExploded;
		},
		get beatsLeft() {
			return beatsLeft;
		},
		turnOff,
		lit,
		explode,
	}]);
	let conductor: ReturnType<typeof k.conductor> = null;

	const bombSpr = bomb.add([
		k.sprite("bomb"),
		k.pos(BOMB_POS),
		k.anchor("center"),
		k.scale(),
		k.color(),
		k.z(1),
	]);

	const cordstart = bomb.add([
		k.sprite("bomb-cord-start"),
		k.pos(29, 528),
	]);

	const cord = bomb.add([
		k.sprite("bomb-cord", { tiled: true, width: k.width() / 2 }),
		k.pos(69, 528),
	]);

	const cordtip = cord.add([
		k.sprite("bomb-cord-tip"),
		k.pos(cord.width, 0),
		k.anchor("center"),
		k.opacity(),
	]);
	cordtip.pos.y += cordtip.height / 2;

	const fuse = cordtip.add([
		k.sprite("bomb-fuse"),
		k.pos(0, 22),
		k.anchor("center"),
		k.scale(),
		k.opacity(),
	]);

	function destroy() {
		bomb.destroy();
		conductor?.destroy();
	}

	let movingFuse = false;
	bomb.onUpdate(() => {
		if (beatsLeft < -1) return;

		const width = k.lerp(cord.width, ((k.width() / 2) / 3) * beatsLeft, 0.75);
		cord.width = width;
		cordtip.pos.x = width;

		if (conductor) conductor.paused = wareApp.gamePaused;
		if (beatsLeft == 0 && !movingFuse) {
			if (cordstart.exists()) cordstart.destroy();
			cordtip.opacity = 0;
			movingFuse = true;
			wareApp.pausableCtx.tween(fuse.pos.y, fuse.pos.y - 30, conductor.beatInterval, (p) => fuse.pos.y = p);
		}
	});

	let hasExploded = false;
	function explode() {
		destroy();
		const kaboom = k.addKaboom(bombSpr.pos);
		kaboom.parent = wareApp.WareScene;
		wareApp.pausableCtx.play("explosion");
		hasExploded = true;
	}

	function tick() {
		if (!bombSpr.exists()) return;
		if (beatsLeft > 0) {
			beatsLeft--;
			const tweenMult = 2 - beatsLeft + 1; // goes from 1 to 3;
			wareApp.pausableCtx.tween(k.vec2(1).add(0.33 * tweenMult), k.vec2(1).add((0.33 * tweenMult) / 2), 0.5 / 3, (p) => bombSpr.scale = p, k.easings.easeOutQuint);
			wareApp.pausableCtx.play("tick", { detune: 25 * 2 - beatsLeft });
			if (beatsLeft == 2) bombSpr.color = k.YELLOW;
			else if (beatsLeft == 1) bombSpr.color = k.RED.lerp(k.YELLOW, 0.5);
			else if (beatsLeft == 0) bombSpr.color = k.RED;
		}
		else explode();
	}

	/** Will start a conductor which will explode the bomb in 4 beats (tick, tick, tick, BOOM!) */
	function lit(bpm = 140) {
		conductor = k.conductor(bpm);
		conductor.onBeat((beat, beatTime) => {
			tick();
			if (beat == 4) destroy();
		});
	}

	function turnOff() {
		conductor.destroy();
		fuse.fadeOut(0.5 / 3).onEnd(() => fuse.destroy());
	}

	return bomb;
}

type Sampler<T> = T | (() => T);

export type ConfettiOpt = {
	gravity?: number;
	airDrag?: number;
	spread?: number;
	fade?: number;
	count?: number;
	heading?: Sampler<number>;
	color?: Sampler<Color>;
	pos?: Sampler<Vec2>;
	velocity?: Sampler<number>;
	angularVelocity?: Sampler<number>;
	obj?: () => { draw: () => void; };
};

function addConfetti(opt?: ConfettiOpt) {
	const DEF_COUNT = 80;
	const DEF_GRAVITY = 800;
	const DEF_AIR_DRAG = 0.9;
	const DEF_VELOCITY = [1000, 4000];
	const DEF_ANGULAR_VELOCITY = [-200, 200];
	const DEF_FADE = 0.3;
	const DEF_SPREAD = 60;
	const DEF_SPIN = [2, 8];
	const DEF_SATURATION = 0.7;
	const DEF_LIGHTNESS = 0.6;

	opt = opt ?? {};

	const confetti = k.add([]);
	// @ts-ignore
	const sample = <T>(s: Sampler<T>): T => typeof s === "function" ? s() : s;
	for (let i = 0; i < (opt.count ?? DEF_COUNT); i++) {
		const p = confetti.add([
			k.pos(sample(opt.pos ?? k.vec2(0, 0))),
			opt.obj ? opt.obj() : k.choose([
				k.rect(k.rand(4, 20), k.rand(4, 20)),
				k.circle(k.rand(3, 10)),
			]),
			k.color(sample(opt.color ?? k.hsl2rgb(k.rand(0, 1), DEF_SATURATION, DEF_LIGHTNESS))),
			k.opacity(1),
			k.lifespan(4),
			k.scale(1),
			k.anchor("center"),
			k.z(999),
			k.rotate(k.rand(0, 360)),
		]);
		const spin = k.rand(DEF_SPIN[0], DEF_SPIN[1]);
		const gravity = opt.gravity ?? DEF_GRAVITY;
		const airDrag = opt.airDrag ?? DEF_AIR_DRAG;
		const heading = sample(opt.heading ?? 0) - 90;
		const spread = opt.spread ?? DEF_SPREAD;
		const head = heading + k.rand(-spread / 2, spread / 2);
		const fade = opt.fade ?? DEF_FADE;
		const vel = sample(opt.velocity ?? k.rand(DEF_VELOCITY[0], DEF_VELOCITY[1]));
		let velX = Math.cos(k.deg2rad(head)) * vel;
		let velY = Math.sin(k.deg2rad(head)) * vel;
		const velA = sample(opt.angularVelocity ?? k.rand(DEF_ANGULAR_VELOCITY[0], DEF_ANGULAR_VELOCITY[1]));
		p.onUpdate(() => {
			const dt = k.dt();
			velY += gravity * dt;
			p.pos.x += velX * dt;
			p.pos.y += velY * dt;
			p.angle += velA * dt;
			p.opacity -= fade * dt;
			velX *= airDrag;
			velY *= airDrag;
			p.scale.x = k.wave(-1, 1, k.time() * spin);
		});
	}

	return confetti;
}

export function wareObjectsPlugin(k: KAPLAYCtx) {
	return {
		addBomb,
		addPrompt,
		addInputPrompt,
		addConfetti,
	};
}

export default wareObjectsPlugin;
