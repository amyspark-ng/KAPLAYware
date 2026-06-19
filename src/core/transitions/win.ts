import { GameObj } from "kaplay";
import { createTransition } from "./create_transition";

export const winTransition = createTransition("jingle-win", 4, (act, ctx, controller, conductor, parent, jingle, scenery) => {
	act.root.use(ctx.opacity());
	// @ts-ignore
	act.root.opacity = 0;

	const magicNumber = 25 / 16;

	const plainBackground = parent.add([
		ctx.rect(512, 384),
		ctx.pos(ctx.center()),
		ctx.color(ctx.mulfok.LIGHT_VIOLET),
		ctx.anchor("center"),
		ctx.opacity(0),
	]);

	const clock = parent.add([
		ctx.sprite("trans-clock"),
		ctx.pos(ctx.center()),
		ctx.anchor("center"),
		ctx.opacity(0),
	]);

	const minuteHand = parent.add([
		ctx.rect(5, 75),
		ctx.pos(ctx.center()),
		ctx.anchor("bot"),
		ctx.rotate(0), // 30 full hour // 15 half hour
		ctx.color(ctx.mulfok.VOID_VIOLET),
		ctx.opacity(0),
	]);

	const hourHand = parent.add([
		ctx.rect(7, 45),
		ctx.pos(ctx.center()),
		ctx.anchor("bot"),
		ctx.rotate(30 * (controller.progress - 1)),
		ctx.color(ctx.mulfok.VOID_VIOLET),
		ctx.opacity(0),
	]);

	const hearts: GameObj[] = [];
	const getHeartPos = (angle: number) => {
		// X = magnitud * cos(angle)
		const rad = ctx.deg2rad(-90 + angle);
		const magnitude = 175;
		const X = magnitude * Math.cos(rad);
		const Y = magnitude * Math.sin(rad);
		return ctx.center().add(ctx.vec2(X, Y));
	};

	for (let i = 0; i < controller.lives; i++) {
		const heart = parent.add([
			ctx.sprite("heart"),
			ctx.pos(ctx.center()),
			ctx.anchor("center"),
			ctx.scale(),
			ctx.opacity(),
		]);

		heart.pos = getHeartPos((i + controller.heartTurns) * 90);
		parent.wait(conductor.beatInterval * 2, () => {
			parent.tween(heart.scale.scale(1.5), heart.scale.scale(-1, 1), conductor.beatInterval, (p) => heart.scale = p, ctx.easings.easeOutQuint);
		});
		hearts.push(heart);
	}

	const tvstatic = parent.add([
		ctx.sprite("trans-static", { anim: "a" }),
		ctx.pos(ctx.center()),
		ctx.anchor("center"),
		ctx.z(1),
		ctx.opacity(0),
	]);

	parent.add([
		ctx.sprite("trans-background"),
	]);

	parent.tween(scenery.scale.scale(magicNumber), ctx.vec2(1), conductor.beatInterval, (p) => {
		scenery.scale = p;
	}, ctx.easings.easeOutQuint);

	parent.tween(0, 1, conductor.beatInterval * 2, (p) => clock.opacity = p, ctx.easings.easeOutQuint);
	parent.tween(0, 1, conductor.beatInterval * 2, (p) => minuteHand.opacity = p, ctx.easings.easeOutQuint);
	parent.tween(0, 1, conductor.beatInterval * 2, (p) => hourHand.opacity = p, ctx.easings.easeOutQuint);
	parent.tween(0, 1, conductor.beatInterval * 2, (p) => plainBackground.opacity = p, ctx.easings.easeOutQuint);

	parent.tween(0, 1, conductor.beatInterval, (p) => tvstatic.opacity = p, ctx.easings.easeOutQuint);
	parent.wait(conductor.beatInterval, () => {
		tvstatic.opacity = 0;

		parent.tween(minuteHand.angle, minuteHand.angle + 360, conductor.beatInterval * 3, (p) => minuteHand.angle = p, ctx.easings.easeOutQuint).onEnd(() => {
			parent.tween(hourHand.angle, hourHand.angle + 30, conductor.beatInterval / 2, (p) => hourHand.angle = p, ctx.easings.easeOutElastic);
		});
	});
});
