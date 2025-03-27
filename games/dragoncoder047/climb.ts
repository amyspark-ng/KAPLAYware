import { assets } from "@kaplayjs/crew";
import { AreaComp, BodyComp, GameObj, PosComp } from "kaplay";
import { Minigame } from "../../src/game/types";
import mulfokColors from "../../src/plugins/colors";

const smashGame: Minigame = {
    prompt: "climb",
    author: "dragoncoder047",
    rgb: mulfokColors.BLACK,
    input: { keys: { use: true } },
    duration: ctx => [10, 9, 8][ctx.difficulty],
    urlPrefix: "games/dragoncoder047/assets/",
    load(ctx) {
        ctx.loadSprite("steel", assets.steel.sprite);
        ctx.loadSprite("apple", assets.apple.sprite);
        ctx.loadSound("jump", "/climb/jump.wav");
    },
    start(ctx) {
        const game = ctx.add([]);
        const level = ctx.addLevel([
            "#############",
            "#,         ,#",
            "####     ####",
            "#     @     #",
            "#    ###    #",
            "#,         ,#",
            "#############",
        ], {
            tiles: {
                "#": () => [
                    ctx.sprite("steel"),
                    ctx.body({ isStatic: true }),
                    ctx.area(),
                    ctx.anchor("center"),
                    ctx.z(0),
                    "grass",
                ],
                ",": () => [
                    ctx.sprite("apple"),
                    ctx.anchor("center"),
                    ctx.body({ isStatic: true }),
                    ctx.area(),
                    ctx.opacity(1),
                    ctx.rotate(0),
                    ctx.z(1),
                    "apple",
                ],
                "@": () => [
                    ctx.sprite("@bean"),
                    ctx.body(),
                    ctx.area(),
                    ctx.anchor("center"),
                    ctx.z(2),
                    "bean",
                ],
            },
            tileWidth: 64,
            tileHeight: 64,
        });
        level.parent = game;
        const bean = level.get("bean")[0] as GameObj<PosComp | BodyComp | AreaComp>;
        const endgame = () => {
            z.cancel();
            ctx.wait(2, () => {
                ctx.finish();
                level.children.forEach(x => x.paused = x.hidden = true);
                level.destroy();
            });
        };
        const z = ctx.onTimeout(() => {
            ctx.lose();
            endgame();
        });
        const SPEED = 400;
        ctx.onButtonDown("left", () => {
            bean.move(-SPEED, 0);
        });
        ctx.onButtonDown("right", () => {
            bean.move(SPEED, 0);
        });
        ctx.onButtonPress("up", () => {
            if (bean.isGrounded()) {
                bean.jump(1000);
                ctx.play("jump");
            }
        });
        bean.onCollide("apple", apple => {
            ctx.burp();
            apple.isStatic = false;
            apple.collisionIgnore.push("*");
            apple.jump(ctx.rand(200, 400));
            apple.vel.x = ctx.rand(-300, 300);
            const speed = ctx.rand(-100, 100);
            apple.onUpdate(() => apple.angle += speed * ctx.dt());
            apple.fadeOut(1).then(() => apple.destroy());
            if (level.get("apple").filter(apple => apple.isStatic).length === 0) {
                ctx.win();
                endgame();
            }
        });
        const apples = ctx.shuffle(level.get("apple"));
        while (apples.length > ctx.difficulty) {
            apples.pop()!.destroy();
        }
        level.pos = ctx.center().sub(level.tileWidth() * (level.numColumns() - 2) / 2, level.tileHeight() * level.numRows() / 2);
        ctx.setGravity(2500);
        return game;
    },
};

export default smashGame;
