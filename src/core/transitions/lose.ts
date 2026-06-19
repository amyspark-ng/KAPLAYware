import { GameObj } from "kaplay";
import { createTransition } from "./create_transition";

export const loseTransition = createTransition("jingle-lose", 5, (act, ctx, controller, conductor, parent, jingle, scenery) => {
	act.root.use(ctx.opacity());
	// @ts-ignore
	act.root.opacity = 0;

	const magicNumber = 25 / 16;

	parent.add([
		ctx.sprite("trans-background"),
	]);

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
		ctx.rotate(30 * (controller.progress + 2)), // 30 full hour // 15 half hour
		ctx.color(ctx.mulfok.VOID_VIOLET),
		ctx.opacity(0),
	]);

	const hourHand = parent.add([
		ctx.rect(7, 45),
		ctx.pos(ctx.center()),
		ctx.anchor("bot"),
		ctx.rotate(30 * (controller.progress + 2)),
		ctx.color(ctx.mulfok.VOID_VIOLET),
		ctx.opacity(0),
	]);

	const getHeartPos = (angle: number) => {
		// X = magnitud * cos(angle)
		const rad = ctx.deg2rad(-90 + angle);
		const magnitude = 175;
		const X = magnitude * Math.cos(rad);
		const Y = magnitude * Math.sin(rad);
		return ctx.center().add(ctx.vec2(X, Y));
	};

	const hearts: GameObj[] = [];
	for (let i = 0; i <= controller.lives; i++) {
		const heart = parent.add([
			ctx.sprite("heart"),
			ctx.pos(ctx.center()),
			ctx.anchor("center"),
			ctx.scale(),
			ctx.opacity(),
			ctx.color(),
		]);

		heart.pos = getHeartPos((i + controller.heartTurns) * 90);
		hearts.push(heart);
	}

	parent.wait(conductor.beatInterval * 2, () => {
		const brokenHeart = hearts[controller.lives];
		const heartPos = brokenHeart.pos;
		const shake = brokenHeart.onUpdate(() => {
			let shakeOffset = ctx.Vec2.fromAngle(ctx.rand(0, 360)).scale(5);
			brokenHeart.pos = heartPos.add(shakeOffset);
		});
		parent.wait(conductor.beatInterval, () => {
			shake.cancel();
			brokenHeart.color = ctx.BLACK;
			parent.tween(brokenHeart.opacity, 0, conductor.beatInterval, (p) => brokenHeart.opacity = p, ctx.easings.linear);
		});
	});

	const tvstatic = parent.add([
		ctx.sprite("trans-static", { anim: "a" }),
		ctx.pos(ctx.center()),
		ctx.anchor("center"),
		ctx.z(1),
		ctx.opacity(0),
	]);

	parent.tween(scenery.scale.scale(magicNumber), ctx.vec2(1), conductor.beatInterval, (p) => {
		scenery.scale = p;
	}, ctx.easings.easeOutQuint);

	parent.wait(conductor.beatInterval * 3.8, () => {
		hourHand.angle -= 30;
		minuteHand.angle -= 30;
	});

	parent.tween(0, 1, conductor.beatInterval * 2, (p) => clock.opacity = p, ctx.easings.easeOutQuint);
	parent.tween(0, 1, conductor.beatInterval * 2, (p) => minuteHand.opacity = p, ctx.easings.easeOutQuint);
	parent.tween(0, 1, conductor.beatInterval * 2, (p) => hourHand.opacity = p, ctx.easings.easeOutQuint);
	parent.tween(0, 1, conductor.beatInterval * 2, (p) => plainBackground.opacity = p, ctx.easings.easeOutQuint);

	parent.tween(0, 1, conductor.beatInterval, (p) => tvstatic.opacity = p, ctx.easings.easeOutQuint);
	parent.wait(conductor.beatInterval, () => {
		tvstatic.opacity = 0;
	});
});
