import k from "../../src/engine";
import { Minigame } from "../../src/types";

const fishGame: Minigame = {
  prompt: "fish",
  author: "erik",
  rgb: [109, 128, 250],
  duration: (ctx) => 10 - ctx.difficulty / 2,
  urlPrefix: "games/erik/assets/",
  load(ctx) {
    ctx.loadSprite("alert", "sprites/fish/alert.png");
    ctx.loadSprite("bobber", "sprites/fish/bobber.png");
    ctx.loadSprite("watermask", "sprites/fish/watermask.png");
    ctx.loadSprite("island", "sprites/fish/island.png");
    ctx.loadSprite("sea", "sprites/fish/sea.png");
    ctx.loadSprite("mark", "sprites/fish/mark.png");
    ctx.loadSprite("fishing_rod", "sprites/fish/fishing_rod.png");
    ctx.loadSprite("boomsquare", "sprites/fish/boomsquare.png");
    ctx.loadSprite("fish_icon", "sprites/fish/fish_icon.png");
    ctx.loadSprite("mark_sad", "sprites/fish/mark_sad.png");

    ctx.loadSound("reel", "sounds/fish/reel.mp3");
    ctx.loadSound("ding", "sounds/fish/ding.mp3");
    ctx.loadSound("sparkle", "sounds/fish/sparkle.mp3");
    ctx.loadSound("womp", "sounds/fish/womp.mp3");

    ctx.loadSound("song", "sounds/fish/morning_song.mp3");

    ctx.loadSpriteAtlas("sprites/fish/fish.png", {
      fish_medium: {
        x: 0,
        y: 0,
        width: 32,
        height: 80,
      },
      fish_small: {
        x: 32,
        y: 0,
        width: 32,
        height: 80,
      },
    });
  },
  start(ctx) {
    ctx.wait(0.2).then(() => {
      ctx.play("song", {
        volume: 0.5,
        speed: ctx.speed,
      });
    });

    const game = ctx.make();

    const sea = game.add([
      ctx.sprite("sea"),
      ctx.pos(ctx.width() / 2, 0),
      ctx.anchor("center"),
      ctx.scale(4),
    ]);

    sea.onUpdate(() => {
      sea.pos = ctx.vec2(ctx.width() / 2, Math.sin(ctx.time()) * 5 + 20);
    });

    const island = game.add([
      ctx.sprite("island"),
      ctx.pos(ctx.width() / 2, 0),
      ctx.anchor("center"),
      ctx.scale(4),
    ]);

    const markXOffset = -100;

    const mark = game.add([
      ctx.sprite("mark"),
      ctx.pos(island.pos.add(markXOffset, 160)),
      ctx.anchor("center"),
      ctx.scale(2),
    ]);

    const rod = game.add([
      ctx.sprite("fishing_rod"),
      ctx.pos(mark.pos.add(0, 25)),
      ctx.anchor("center"),
      ctx.scale(2),
    ]);

    const rodOffset = ctx.vec2(128, -28);

    rod.onDraw(() => {
      const startPos = rodOffset.scale(0.5);
      const endPos = bobber.pos.sub(rod.pos).scale(0.5);
      const centerPoint = ctx.lerp(startPos, endPos, 0.5).add(ctx.vec2(0, 20));

      // Was not available on ctx
      k.drawCurve(
        (t) => k.evaluateQuadratic(startPos, centerPoint, endPos, t),
        {
          color: ctx.rgb(240, 240, 240),
        }
      );
    });

    let bobberPos = island.pos.add(-markXOffset, 500);
    const bobberScale = 1.5;

    const bobber = game.add([
      ctx.sprite("bobber"),
      ctx.pos(bobberPos),
      ctx.area({ scale: 0.4 }),
      ctx.state("idle", ["idle", "reeling"]),
      ctx.anchor("center"),
      ctx.scale(bobberScale),
    ]);

    bobber.onStateUpdate("idle", () => {
      bobber.pos = bobberPos.add(0, Math.sin(ctx.time() * 2) * 3);
    });

    const bobberWater = game.add([
      ctx.sprite("watermask"),
      ctx.pos(bobber.pos),
      ctx.anchor("center"),
      ctx.scale(bobberScale),
    ]);

    function addFish() {
      const size = ctx.choose(["small", "medium", "small"]);

      const fish = game.add([
        ctx.sprite("fish_" + size),
        ctx.pos(ctx.rand(20, 300), ctx.rand(ctx.height() - 50, 350)),
        ctx.area({
          shape: new ctx.Rect(ctx.vec2(0, -4), 12, 12),
        }),
        ctx.scale(2),
        ctx.opacity(0.5),
        ctx.anchor(ctx.vec2(0, -0.55)),
        ctx.rotate(ctx.rand(0, 360)),
        ctx.state("swimming", ["swimming", "target"]),
        "fish",
      ]);

      let targetPos = ctx.Vec2.fromAngle(fish.angle).scale(50).add(fish.pos);

      fish.onUpdate(() => {
        const angle = fish.pos.angle(targetPos) - 90;
        const targetAngle =
          angle + Math.sin(ctx.time() * 20) * 2 + Math.cos(ctx.time() * 10) * 2;

        // Determine if the fish angle should exceed 360 degrees because the distance between the target angle and the fish angle is greater than 180 degrees
        if (targetAngle - fish.angle > 180) {
          fish.angle += 360;
        }

        fish.angle = ctx.lerp(fish.angle, targetAngle, 0.1);

        if (fish.state === "swimming") {
          const distance = fish.pos.dist(targetPos);
          if (distance < 5) {
            targetPos = ctx.vec2(
              ctx.rand(20, 300),
              ctx.rand(ctx.height() - 50, 350)
            );
          }
          fish.moveTo(targetPos, 64 * ctx.speed);
        } else if (fish.state === "target") {
          const distance = fish.pos.dist(targetPos);

          if (distance < 10) {
            targetPos = ctx.vec2(
              ctx.rand(900, 1000),
              ctx.rand(ctx.height() - 50, 350)
            );
          }

          fish.moveTo(targetPos, 256 * ctx.speed);
        }
      });

      fish.onStateEnter("target", () => {
        targetPos = bobber.pos;
      });

      return fish;
    }

    // fishes? fishs? fishies? fish?
    const fishs = [addFish(), addFish()];

    if (ctx.difficulty == 1) {
      fishs.push(addFish());
    }

    function fishLoop() {
      const fish = fishs.pop();

      if (!fish || bobber.state === "reeling") {
        return;
      }

      fish.enterState("target");

      if (fishs.length >= 0) {
        ctx.wait(ctx.rand(0.5, 1) / (ctx.speed * 1.5)).then(() => {
          fishLoop();
        });
      }
    }

    ctx.wait(0.3).then(() => {
      fishLoop();
    });

    bobber.onCollide("fish", (fish) => {
      ctx.play("ding");

      const alertPos = bobber.pos.add(0, -70);

      const alert = game.add([
        ctx.sprite("alert"),
        ctx.pos(alertPos),
        ctx.anchor("center"),
        ctx.scale(2),
        ctx.opacity(0),
      ]);

      ctx.tween(ctx.vec2(0, -10), ctx.vec2(0, -15), 0.5, (v) => {
        alert.pos = alertPos.add(v);
      });

      ctx
        .tween(1, 0, 0.5, (p) => (alert.opacity = p))
        .then(() => alert.destroy());
    });

    bobber.onStateEnter("reeling", () => {
      fishs.forEach((fish) => {
        fish.enterState("swimming");
      });
    });

    ctx.onButtonPress("action", async () => {
      if (bobber.state === "reeling") {
        return;
      }

      const collisions = bobber.getCollisions();

      if (collisions.length > 0) {
        const col = collisions[0];

        col.target?.destroy();

        await endAnimation();
      }
    });

    const loseCheck = game.onUpdate(() => {
      const fish = game.get("fish");

      if (
        fish.every((f) => f.pos.x > bobber.pos.x + 30) &&
        bobber.state !== "reeling"
      ) {
        loseCheck.cancel();
        loseAnimation();
      }
    });

    async function bobberReelAnimation() {
      bobber.enterState("reeling");

      bobber.add([
        ctx.sprite("fish_icon"),
        ctx.anchor("center"),
        ctx.scale(1.3),
        ctx.pos(0, 5),
      ]);

      bobberWater.destroy();

      const startPos = bobber.pos;
      const endPos = rod.pos.add(rodOffset).add(0, 30);

      const distance = startPos.dist(endPos);

      const centerPoint = ctx
        .lerp(startPos, endPos, 0.5)
        .add(ctx.vec2(0, (-2 * distance) / 5));

      const reelSound = ctx.play("reel");

      const reelSpeed = 1;

      await ctx.tween(0, 1, reelSpeed / ctx.speed, (p) => {
        // Was not available on ctx
        bobber.pos = k.evaluateQuadratic(startPos, centerPoint, endPos, p);
      });

      reelSound.stop();
    }

    async function endAnimation() {
      ctx.win();

      await bobberReelAnimation();

      const boomSquare = game.add([
        ctx.sprite("boomsquare"),
        ctx.pos(ctx.width() / 2, ctx.height() / 2),
        ctx.anchor("center"),
        ctx.scale(0),
        ctx.rotate(10),
      ]);

      boomSquare.onUpdate(() => {
        boomSquare.angle += 5 * ctx.dt();
      });

      ctx.tween(
        0,
        3 / ctx.speed,
        0.5,
        (p) => (boomSquare.scale = k.vec2(p)),
        ctx.easings.easeOutCubic
      );

      const fishSpr = k.choose(["@sukomi-o", "@bobo-o", "@cake-o", "@bean-o"]);

      const fish = game.add([
        ctx.sprite(fishSpr),
        ctx.pos(ctx.width() / 2, ctx.height() / 2),
        ctx.anchor("center"),
        ctx.scale(0),
        ctx.rotate(-10),
      ]);

      ctx.tween(
        0,
        3 / ctx.speed,
        0.5,
        (p) => (fish.scale = k.vec2(p)),
        ctx.easings.easeOutCubic
      );

      ctx.play("sparkle");

      ctx.wait(1 / ctx.speed, () => ctx.finish());
    }

    async function loseAnimation() {
      await ctx.wait(0.4 / ctx.speed);

      if (bobber.state === "reeling") {
        return;
      }

      mark.sprite = "mark_sad";

      ctx.play("womp");

      ctx.lose();
      ctx.wait(1 / ctx.speed, () => ctx.finish());
    }

    ctx.onTimeout(() => {
      ctx.lose();
      ctx.finish();
    });

    return game;
  },
};

export default fishGame;
