import { Color, GameObj, KAPLAYCtx, Mat4, Vec2 } from "kaplay";
import k from "./engine";
import { KaplayWareCtx } from "./types";

export function addPrompt(prompt: string, time: number = 0.25, wobbleLetters: boolean = true) {
	const promptTitle = k.add([
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
	]);

	promptTitle.tween(0, 1.2, time, (p) => promptTitle.scale.x = p, k.easings.easeOutExpo);
	promptTitle.tween(0, 0.9, time, (p) => promptTitle.scale.y = p, k.easings.easeOutExpo).onEnd(() => {
		promptTitle.tween(promptTitle.scale, k.vec2(1), time * 1.1, (p) => promptTitle.scale = p, k.easings.easeOutElastic).onEnd(() => {
			// now do the shaky letters
			if (wobbleLetters == false) return;

			let magnitude = 0;
			let angle = 0;
			promptTitle.onUpdate(() => {
				magnitude = k.lerp(magnitude, k.randi(2, 8), 0.1);
				angle = k.lerp(angle, angle + 1, 0.1) % 360;
				promptTitle.textTransform = (idx, ch) => ({
					pos: k.vec2(magnitude * Math.cos(angle * idx + 1), magnitude * Math.sin(angle * idx + 1)),
				});
			});
		});
	});
	return promptTitle;
}

export function makeHearts(parent: GameObj | KAPLAYCtx, amount: number) {
	const hearts: ReturnType<typeof makeHeart>[] = [];
	for (let i = 0; i < amount; i++) {
		const heart = parent.add(makeHeart());
		heart.scale = k.vec2(2);
		const HEART_WIDTH = heart.width * heart.scale.x * 1.1;
		const INITIAL_POS = k.vec2(k.center().x - HEART_WIDTH * 1.5, 0);
		heart.pos = INITIAL_POS.add(k.vec2(HEART_WIDTH * i, heart.height * 2));
		hearts.push(heart);
	}

	return hearts;
}

export function makeHeart() {
	const heart = k.make([
		k.sprite("@heart"),
		k.pos(),
		k.anchor("center"),
		k.scale(1),
		k.rotate(),
		k.opacity(),
		k.z(100),
		"heart",
		{
			kill() {
			},
		},
	]);

	heart.kill = () => {
		heart.fadeOut(0.5).onEnd(() => heart.destroy());
	};

	return heart;
}

export function makeScoreText(score: number) {
	return k.make([
		k.text(`${score.toString()}`, { align: "left" }),
		k.color(k.WHITE),
		k.anchor("center"),
		k.scale(4),
		k.rotate(0),
		k.pos(k.center().x, k.center().y - 150),
		k.timer(),
	]);
}

export function makeFriend(name: string) {
	return k.make([
		k.sprite("@" + name),
		k.scale(2),
		k.pos(),
		k.anchor("bot"),
		k.rotate(0),
	]);
}

export function addBomb(ware: KaplayWareCtx) {
	const timeAtCreate = ware.time;

	const BOMB_POS = k.vec2(40, k.height() - 40);

	const cord = k.add([
		k.sprite("@bomb_cord", { tiled: true }),
		k.pos(69, 527),
		k.anchor("left"),
		k.fixed(),
	]);

	const cord1 = k.add([
		k.sprite("@bomb_cord1"),
		k.pos(29, 528),
		k.fixed(),
	]);

	const fuse = k.add([
		k.sprite("@bomb_fuse"),
		k.pos(),
		k.anchor("center"),
		k.scale(),
		k.opacity(),
		k.fixed(),
	]);

	const bomb = k.add([
		k.sprite("@bomb"),
		k.pos(BOMB_POS),
		k.anchor("center"),
		k.scale(),
		k.color(),
		k.fixed(),
	]);

	cord.width = k.width() - 100;
	const fullCordWidth = cord.width;
	const totalBeats = 6;
	let beatsLeft = totalBeats;
	let cordWidth = fullCordWidth;

	function destroy() {
		cord1.destroy();
		bomb.destroy();
		cord.destroy();
		fuse.destroy();
	}

	let fuseYThing = 0;
	bomb.onUpdate(() => {
		if (beatsLeft < -1) return;

		cordWidth = (fullCordWidth / totalBeats) * beatsLeft;
		if (ware.time <= (timeAtCreate / (totalBeats + 1)) * beatsLeft) {
			beatsLeft--;

			if (beatsLeft == 0 || beatsLeft == 1 || beatsLeft == 2) {
				const tweenMult = 2 - beatsLeft + 1; // goes from 1 to 3;
				k.tween(k.vec2(1).add(0.33 * tweenMult), k.vec2(1).add((0.33 * tweenMult) / 2), timeAtCreate / totalBeats, (p) => bomb.scale = p, k.easings.easeOutQuint);
				k.play("@tick", { detune: 25 * 2 - beatsLeft });
			}

			if (beatsLeft == 2) bomb.color = k.YELLOW;
			else if (beatsLeft == 1) bomb.color = k.RED.lerp(k.YELLOW, 0.5);
			else if (beatsLeft == 0) bomb.color = k.RED;

			if (beatsLeft == -1) {
				destroy();
				k.addKaboom(bomb.pos);
				k.play("@explosion");
			}
		}

		if (beatsLeft != 0) {
			fuse.pos = k.lerp(fuse.pos, cord.pos.add(cord.width, 50), 0.75);
		}
		else {
			fuseYThing += 1.5;
			if (cord1.exists()) cord1.destroy();
			fuse.pos = k.lerp(fuse.pos, k.vec2(cord.pos.x + cord.width, cord.pos.y + 50 - fuseYThing), 0.75);
		}

		cord.width = k.lerp(cord.width, cordWidth, 0.75);
	});

	return {
		destroy,
		turnOff: () => {
			fuse.fadeOut(timeAtCreate / totalBeats).onEnd(() => fuse.destroy());
		},
	};
}

export type Sampler<T> = T | (() => T);

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

export function makeConfetti() {
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

	const opt: ConfettiOpt = {};

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
