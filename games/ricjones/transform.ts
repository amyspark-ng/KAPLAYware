import { assets } from "@kaplayjs/crew";
import { Minigame } from "../../src/types.ts";
import { TweenController } from "kaplay";

const transformGame: Minigame = {
  prompt: "transform",
  author: "ricjones",
  rgb: [74, 48, 82], // rgb for #4a3052 from mulfok32 palette
  urlPrefix: "games/ricjones/assets",
  load(ctx) {
    ctx.loadSound("jump", "/jump_37.wav");
    ctx.loadSprite("chad", "/chadbean-amy.png");
    ctx.loadSprite("strong", "/strong.png")
    ctx.loadSprite("bg", "/gym_room_bg.png")
  },
  start(ctx) {
    const PIXEL_VEL = ctx.width() * 0.5 * ctx.speed;
    enum DIRECTION {
      LEFT,
      RIGHT,
      UP,
      DOWN,
    }

    const orders: number[] = [];
    for (let i = 0; i < 4; i++) {
      orders.push(ctx.randi(3));
    }

    let currIdx = 0;
    const game = ctx.make();
    game.add([
      ctx.pos(0, 0),
      ctx.sprite("bg")
    ])

    function updateCommandSprite(_obj: GameObjRaw, _dir: DIRECTION) {
      switch (_dir) {
        case DIRECTION.RIGHT: {
          _obj.angle = 0;
          _obj.scale.x = 1 / 2;
          _obj.scale.y = 1 / 2;
          break;
        }
        case DIRECTION.LEFT: {
          _obj.angle = 0;
          _obj.scale.x = -1 / 2;
          _obj.scale.y = 1 / 2;
          break;
        }
        case DIRECTION.UP: {
          _obj.angle = -90;
          _obj.scale.x = 1 / 2;
          _obj.scale.y = 1 / 2;
          break;
        }
        case DIRECTION.DOWN: {
          _obj.angle = 90;
          _obj.scale.x = 1 / 2;
          _obj.scale.y = 1 / 2;
          break;
        }
      }
    }

    function createCommand(dir: DIRECTION) {
      const _obj = game.add([
        ctx.offscreen({ hide: true }),
        ctx.sprite("strong"),
        ctx.area(),
        ctx.rotate(),
        ctx.scale(),
        ctx.pos(),
        ctx.opacity(),
        ctx.anchor("center"),
        { canMove: true, command_dir: dir },
        "command",
      ]);

      _obj.pos = spawnPointLeft;

      updateCommandSprite(_obj, dir)

      return _obj;
    }

    // checking box for the transform
    const check = game.add([
      ctx.rect(300, 100, { fill: false }),
      ctx.pos(ctx.width() * 0.5, ctx.height() * 0.18),
      ctx.anchor("center"),
      ctx.area(),
      ctx.outline(2, ctx.RED),
    ]);

    const spawnPointLeft = ctx.vec2(0, ctx.height() * 0.18);

    // spawn button sprites
    const left_com = createCommand(orders[currIdx]);

    let canPress = true;

    const transitionScreen = game.add([
      ctx.rect(ctx.width(), ctx.height()),
      ctx.pos(0, 0),
      ctx.color(ctx.WHITE),
      ctx.opacity(0),
      ctx.z(100),
      ctx.timer(),
    ]);

    function clearPrevCanvas() {
      check.destroy();
      left_com.destroy();
      bean.destroy();
    }

    // put all the obj you need on the screen, depends on the winning cond
    function createGameOverScreen(isWin: boolean = true) {
      if (!isWin) {
        game.add([
          ctx.sprite("@bobo"),
          ctx.anchor("center"),
          ctx.pos(ctx.width() * 0.4, ctx.height() / 2),
          ctx.rotate(-95),
          ctx.scale(2.5),
        ]);
        ctx.lose();
        ctx.wait(1.5 / ctx.speed, () => {
          ctx.finish();
        });
        return;
      }

      const chad1 = game.add([
        ctx.sprite("chad"),
        ctx.anchor("botleft"),
        ctx.pos(-800, ctx.height()),
        ctx.scale(1),
        ctx.animate(),
      ]);

      const dialog1 = game.add([
        ctx.text("oh hi !"),
        ctx.pos(ctx.width() / 2, ctx.height() * 0.3),
        ctx.opacity(0),
        ctx.animate(),
      ]);

      chad1.animate(
        "pos",
        [ctx.vec2(-chad1.width, ctx.height()), ctx.vec2(0, ctx.height())],
        {
          duration: 0.5 / ctx.speed,
          loops: 1,
          easing: ctx.easings.easeOutCubic,
        }
      );
      chad1.onAnimateFinished(() => {
        dialog1.animate("opacity", [0, 1], {
          duration: 0.4 / ctx.speed,
          loops: 1,
        });
      });

      ctx.win();
      ctx.wait(1.5 / ctx.speed, () => ctx.finish());
    }

    function goToGameOver(isWin: boolean = true) {
      // clear all previous objects
      clearPrevCanvas();
      // fade in
      transitionScreen
        .tween(0, 1, 0.3 / ctx.speed, (v) => {
          transitionScreen.opacity = v;
        })
        .onEnd(() => {
          // fade out
          transitionScreen
            .tween(1, 0, 0.3 / ctx.speed, (v) => {
              transitionScreen.opacity = v;
            })
            .onEnd(() => {
              createGameOverScreen(isWin);
            });
        });
    }

    function updateBothCommands() {
      currIdx = ctx.clamp(currIdx + 1, 0, orders.length);
      // go to the win condition screen.
      if (currIdx > orders.length - 1) {
        ctx.play("jump", {
          volume: 1.0,
        });
        goToGameOver(true);
        return;
      }

      const next_comm = orders[currIdx];
      updateCommandSprite(left_com, next_comm)
      //left_com.command_dir = next_comm;
      //left_com.sprite = dir_sprites[next_comm];
      left_com.pos = spawnPointLeft;

      let _playVol = 0.5 + 0.25 * (currIdx - 1);
      ctx.play("jump", {
        volume: _playVol,
      });

      const tScale = ctx.lerp(1, 4, currIdx + 1 / orders.length);
      // use animate instead
      bean.animate("scale", [bean.scale, ctx.vec2(tScale)], {
        duration: 1 / ctx.speed,
        loops: 1,
      });
    }

    const bean = game.add([
      ctx.sprite("@bean"),
      ctx.anchor("bot"),
      ctx.pos(ctx.width() * 0.3, ctx.height() * 0.65),
      ctx.scale(1),
      ctx.animate(),
    ]);

    function isInputValid(_dir: DIRECTION) {
      return (
        check.isOverlapping(left_com) &&
        left_com.command_dir == _dir &&
        canPress
      );
    }

    // checking input if it is within the box
    ctx.onButtonPress("up", () => {
      if (isInputValid(DIRECTION.UP)) {
        updateBothCommands();
      }
    });

    ctx.onButtonPress("down", () => {
      if (isInputValid(DIRECTION.DOWN)) {
        updateBothCommands();
      }
    });

    ctx.onButtonPress("left", () => {
      if (isInputValid(DIRECTION.LEFT)) {
        updateBothCommands();
      }
    });

    ctx.onButtonPress("right", () => {
      if (isInputValid(DIRECTION.RIGHT)) {
        updateBothCommands();
      }
    });

    left_com.onUpdate(() => {
      if (!left_com.canMove) {
        left_com.move(0, 0);
      } else {
        left_com.move(PIXEL_VEL, 0);
      }
    });

    game.onUpdate(() => {
      if (left_com.pos.x >= check.pos.x + check.width * 0.5 && canPress) {
        bean.sprite = "@beant";
        ctx.wait(0.4 / ctx.speed, () => {
          //resets
          currIdx = 0;
          canPress = false;
          // lose screen
          goToGameOver(false);
        });
      }
    })


    // game is lost when the command icons clashes ( needs rewrite )
    // left_com.onCollide("command", () => {
    //   bean.sprite = "@beant";
    //   ctx.wait(0.4 / ctx.speed, () => {
    //     //resets
    //     currIdx = 0;
    //     canPress = false;
    //     // lose screen
    //     goToGameOver(false);
    //   });
    //   // ctx.lose();
    //   // ctx.wait(0.5, () => ctx.finish());
    // });

    return game;
  },
};

export default transformGame;
