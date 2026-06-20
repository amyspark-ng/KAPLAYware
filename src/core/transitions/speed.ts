import { GameObj } from "kaplay";
import { createTransition } from "./create_transition";

export const speedTransition = createTransition("jingle-speed", 10, (act, controller, conductor, parent, transScenery, gameAct) => {
	const ctx = act.ctx;
	act.root.use(ctx.opacity());
	// @ts-ignore
	act.root.opacity = 0;

	const plainBackground = parent.add([
		ctx.rect(513, 388),
		ctx.pos(ctx.center()),
		ctx.color(ctx.mulfok.LIGHT_VIOLET),
		ctx.anchor("center"),
		ctx.opacity(1),
	]);

	const clock = parent.add([
		ctx.sprite("trans-clock"),
		ctx.pos(ctx.center()),
		ctx.anchor("center"),
		ctx.opacity(1),
	]);

	const minuteHand = parent.add([
		ctx.rect(5, 75),
		ctx.pos(ctx.center()),
		ctx.anchor("bot"),
		ctx.rotate(0), // 30 full hour // 15 half hour
		ctx.color(ctx.mulfok.VOID_VIOLET),
		ctx.opacity(1),
	]);

	const hourHand = parent.add([
		ctx.rect(7, 45),
		ctx.pos(ctx.center()),
		ctx.anchor("bot"),
		ctx.rotate(30 * (controller.progress - 1)),
		ctx.color(ctx.mulfok.VOID_VIOLET),
		ctx.opacity(1),
	]);

	const secondHand = parent.add([
		ctx.rect(4, 75),
		ctx.pos(ctx.center()),
		ctx.anchor("bot"),
		ctx.rotate(0), // 30 full hour // 15 half hour
		ctx.color(ctx.RED),
		ctx.opacity(1),
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
		hearts.push(heart);
	}

	const text = parent.add([
		ctx.text("SPEED\nUP", { align: "center" }),
		ctx.anchor("center"),
		ctx.pos(ctx.center().x - 500, ctx.center().y),
		ctx.scale(2),
	]);

	parent.add([
		ctx.sprite("trans-background"),
	]);

	// second hand
	parent.tween(0, 360, conductor.beatInterval * 1.95, (p) => secondHand.angle = p, ctx.easings.linear).onEnd(() => {
		parent.tween(0, 360, conductor.beatInterval * 1.95, (p) => secondHand.angle = p, ctx.easings.linear).onEnd(() => {
			parent.tween(0, 360, conductor.beatInterval * 1.25, (p) => secondHand.angle = p, ctx.easings.linear).onEnd(() => {
				parent.tween(0, 360, conductor.beatInterval * 1.25, (p) => secondHand.angle = p, ctx.easings.linear).onEnd(() => {
					parent.tween(0, 360, conductor.beatInterval * 1.25, (p) => secondHand.angle = p, ctx.easings.linear).onEnd(() => {
						parent.tween(0, 360, conductor.beatInterval * 1.25, (p) => secondHand.angle = p, ctx.easings.linear);
					});
				});
			});
		});
	});

	conductor.onBeat((beat, beatInterval) => {
		parent.tween(ctx.vec2(2, 2.5), ctx.vec2(2, 2), beatInterval / 2, (p) => text.scale = p, ctx.easings.easeOutQuint);
		if (beat == 1) {
			parent.tween(text.pos.x, ctx.center().x, beatInterval, (p) => text.pos = ctx.vec2(p, text.pos.y), ctx.easings.easeOutQuint);
		}
		else if (beat == 9) {
			parent.tween(text.pos.x, ctx.center().x + 500, beatInterval, (p) => text.pos = ctx.vec2(p, text.pos.y), ctx.easings.easeOutQuint);
		}
	});
});
