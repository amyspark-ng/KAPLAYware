import { Color, KAPLAYCtx, Vec2 } from "kaplay";
import k from "../engine";
import { getGameInput } from "../game/utils";

function addPrompt(prompt: string) {
	const promptObj = k.add([
		k.color(k.WHITE),
		k.fixed(),
		k.text(`[a]${prompt}[/a]`, {
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
		k.timer(),
		k.z(101),
		{
			shakyLetters: true,
		},
	]);

	promptObj.tween(0, 1.2, 0.25, (p) => promptObj.scale.x = p, k.easings.easeOutExpo);
	promptObj.tween(0, 0.9, 0.25, (p) => promptObj.scale.y = p, k.easings.easeOutExpo).onEnd(() => {
		promptObj.tween(promptObj.scale, k.vec2(1), 0.25 * 1.1, (p) => promptObj.scale = p, k.easings.easeOutElastic).onEnd(() => {
			// now do the shaky letters

			let magnitude = 0;
			let angle = 0;
			promptObj.onUpdate(() => {
				if (promptObj.shakyLetters) {
					magnitude = k.lerp(magnitude, k.randi(2, 8), 0.1);
					angle = k.lerp(angle, angle + 1, 0.1) % 360;
					promptObj.textTransform = (idx, ch) => ({
						pos: k.vec2(magnitude * Math.cos(angle * ((idx % 2) + 1) + 1), magnitude * Math.sin(angle * ((idx % 2) + 1) + 1)),
					});
				}
				else {
					promptObj.textTransform = (idx, ch) => ({
						pos: k.vec2(),
					});
				}
			});
		});
	});
	return promptObj;
}

function addInputPrompt(input: ReturnType<typeof getGameInput>) {
	const inputPrompt = k.add([
		k.sprite("inputprompt_" + input),
		k.anchor("center"),
		k.pos(k.center()),
		k.scale(),
	]);

	k.tween(k.vec2(0), k.vec2(1), 0.25, (p) => inputPrompt.scale = p, k.easings.easeOutElastic);
	return inputPrompt;
}

function addBomb() {
	const BOMB_POS = k.vec2(40, k.height() - 40);

	const bomb = k.add([k.timer()]);

	const cord = bomb.add([
		k.sprite("@bomb_cord", { tiled: true }),
		k.pos(69, 527),
		k.anchor("left"),
		k.fixed(),
	]);

	const cordstart = bomb.add([
		k.sprite("@bomb_cord_start"),
		k.pos(29, 528),
		k.fixed(),
	]);

	const cordtip = bomb.add([
		k.sprite("@bomb_cord_tip"),
		k.pos(29, 528),
		k.fixed(),
	]);

	const fuse = bomb.add([
		k.sprite("@bomb_fuse"),
		k.pos(),
		k.anchor("center"),
		k.scale(),
		k.opacity(),
		k.fixed(),
	]);

	const bombSpr = bomb.add([
		k.sprite("@bomb"),
		k.pos(BOMB_POS),
		k.anchor("center"),
		k.scale(),
		k.color(),
		k.fixed(),
	]);

	cord.width = k.width() - 100;
	let beatsLeft = 3;
	let cordWidth = k.width() / 2;

	function destroy() {
		bomb.destroy();
		cordstart.destroy();
		cord.destroy();
		cordtip.destroy();
		fuse.destroy();
	}

	let fuseYThing = 0;
	bomb.onUpdate(() => {
		if (beatsLeft < -1) return;

		cordWidth = ((k.width() / 2) / 3) * beatsLeft;
		if (beatsLeft != 0) {
			fuse.pos = k.lerp(fuse.pos, cord.pos.add(cord.width, 50), 0.75);
			cordtip.pos = fuse.pos.sub(cordtip.width / 2, 50);
		}
		else {
			fuseYThing += 1.5;
			if (cordtip.exists()) cordtip.destroy();
			if (cordstart.exists()) cordstart.destroy();
			fuse.pos = k.lerp(fuse.pos, k.vec2(cord.pos.x + cord.width, cord.pos.y + 50 - fuseYThing), 0.75);
		}

		cord.width = k.lerp(cord.width, cordWidth, 0.75);
	});

	return {
		bomb,
		destroy,
		turnOff: () => {
			fuse.fadeOut(0.5 / 3).onEnd(() => fuse.destroy());
		},
		tick: () => {
			if (!bombSpr.exists()) return;
			if (beatsLeft > 0) {
				beatsLeft--;
				const tweenMult = 2 - beatsLeft + 1; // goes from 1 to 3;
				k.tween(k.vec2(1).add(0.33 * tweenMult), k.vec2(1).add((0.33 * tweenMult) / 2), 0.5 / 3, (p) => bombSpr.scale = p, k.easings.easeOutQuint);
				k.play("@tick", { detune: 25 * 2 - beatsLeft });
				if (beatsLeft == 2) bombSpr.color = k.YELLOW;
				else if (beatsLeft == 1) bombSpr.color = k.RED.lerp(k.YELLOW, 0.5);
				else if (beatsLeft == 0) bombSpr.color = k.RED;
			}
			else {
				destroy();
				const kaboom = k.addKaboom(bombSpr.pos);
				k.play("@explosion");
			}
		},
		get hasExploded() {
			return beatsLeft == 0;
		},
		beatsLeft,
	};
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

function makeConfetti(opt?: ConfettiOpt) {
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

	const confetti = k.make();
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
		addPrompt,
		addInputPrompt,
		addBomb,
		makeConfetti,
	};
}

export default wareObjectsPlugin;
