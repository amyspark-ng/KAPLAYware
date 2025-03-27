import { assets } from "@kaplayjs/crew";
import { BodyComp, GameObj, OpacityComp, PosComp, RotateComp } from "kaplay";
import { Minigame } from "../../src/game/types";
import mulfokColors from "../../src/plugins/colors";

const smashGame: Minigame = {
    prompt: "smash",
    author: "dragoncoder047",
    rgb: mulfokColors.LIGHT_BLUE,
    input: { cursor: { hide: false } },
    duration: (ctx) => [10, 7, 5][ctx.difficulty - 1],
    urlPrefix: "games/dragoncoder047/assets/",
    load(ctx) {
        ctx.loadSprite("grass", assets.grass.sprite);
        ctx.loadSprite("steel", assets.steel.sprite);
        ctx.loadSprite("apple", assets.apple.sprite);
        ctx.loadSound("boom", "/smash/explode.mp3");
    },
    start(ctx) {
        const game2 = ctx.make([]);
        game2.add([
            ctx.pos(ctx.center().x, 20),
            ctx.anchor("top"),
            ctx.text("Get beans to apples!!", { align: "center" }),
        ]);
        const level = ctx.addLevel([
            " |||||||||",
            "|         |",
            "| @  @  @ |",
            "| %  %  % |",
            "| %  %  % |",
            "|,%,,%,,%,|-",
            " #########",
        ], {
            tiles: {
                "#": () => [
                    ctx.sprite("grass"),
                    ctx.body({ isStatic: true }),
                    ctx.area(),
                    ctx.anchor("center"),
                    ctx.z(-1),
                    "grass",
                ],
                "%": () => [
                    ctx.sprite("steel"),
                    ctx.body({ drag: 1 }),
                    ctx.area(),
                    ctx.opacity(1),
                    ctx.anchor("center"),
                    "steel",
                ],
                ",": () => [
                    ctx.sprite("apple"),
                    ctx.anchor("center"),
                    ctx.z(0),
                    ctx.opacity(1),
                    ctx.rotate(0),
                    ctx.body({ isStatic: true }),
                    "apple",
                ],
                "@": () => [
                    ctx.sprite("@bean"),
                    ctx.body({ drag: 1 }),
                    ctx.area(),
                    ctx.anchor("center"),
                    ctx.z(1),
                    {
                        eaten: false,
                    },
                    "bean",
                ],
                "-": () => [
                    "winMarker"
                ],
                "|": () => [
                    ctx.rect(64, 64),
                    ctx.body({ isStatic: true }),
                    ctx.area(),
                    ctx.opacity(0),
                    "barrier",
                ]
            },
            tileWidth: 64,
            tileHeight: 64,
        });
        ctx.onClick(() => {
            const where = ctx.mousePos();
            level.get("body", { only: "comps" }).forEach(((body: GameObj<BodyComp | PosComp | OpacityComp>) => {
                if (body.is("apple") || body.isStatic) return;
                const diff = body.worldPos()!.sub(where);
                const dist = diff.len();
                var bang = diff.unit().scale(10000 / dist);
                if (bang.slen() > (1000 * 1000)) bang = bang.unit().scale(1000);
                if (body.has("opacity")) {
                    body.opacity -= bang.slen() / 50000;
                    if (body.opacity <= 0) {
                        body.destroy();
                        ctx.addKaboom(body.worldPos()!, { scale: 1 / 4 });
                        return;
                    }
                }
                body.applyImpulse(bang);
                ctx.play("boom", { volume: 0.1 });
            }) as any);
            ctx.addKaboom(where, { scale: 1 / 2 });
        });
        const endgame = () => {
            y.cancel();
            ctx.wait(2, () => {
                ctx.finish();
                level.children.forEach(x => x.paused = x.hidden = true);
                level.destroy();
            });
        };
        const y = game2.onUpdate(() => {
            const beans: GameObj<PosComp | { eaten: boolean }>[] = level.get("bean", { only: "tags" }) as any;
            var eatingBeans = 0;
            const winY = level.get("winMarker", { only: "tags" })[0].pos.y;
            beans.forEach((bean: GameObj<PosComp | { eaten: boolean }>) => {
                if (bean.pos.y > winY || bean.eaten) {
                    if (!bean.eaten) {
                        ctx.burp();
                        bean.eaten = true;
                        for (var i = 0; i < 2; i++) {
                            const apple = level.get("apple", { only: "tags" }).filter(apple => apple.isStatic).sort((a, b) => a.pos.dist(bean.pos) - b.pos.dist(bean.pos))[0];
                            apple.isStatic = false;
                            apple.jump(ctx.rand(200, 400));
                            apple.vel.x = ctx.rand(-100, 100);
                            const speed = ctx.rand(-30, 30);
                            apple.onUpdate(() => apple.angle += speed * ctx.dt());
                            apple.fadeOut(1).then(() => apple.destroy());
                        }
                    }
                    eatingBeans++;
                }
            });
            if (eatingBeans >= beans.length) {
                ctx.win();
                endgame();
            }
        });
        ctx.onTimeout(() => {
            ctx.lose();
            level.get("area", { only: "comps" }).forEach(o => o.collisionIgnore.push("*"));
            endgame();
        });
        level.pos = ctx.center().sub(level.tileWidth() * (level.numColumns() - 2) / 2, level.tileHeight() * level.numRows() / 2);
        ctx.setGravity(500);
        return game2;
    },
};

export default smashGame;
