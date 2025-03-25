import kaplay, { Vec2, GameObj } from "kaplay";
import { Minigame } from "../../src/game/types.ts";

const aimGame: Minigame = {
    prompt: "aim",
    author: "kiwisky",
    rgb: [141, 183, 255],
    urlPrefix: "games/kiwisky/assets/",
    input: { cursor: { hide: true } },
    duration: 6,
    load(ctx)
    {
        //ctx.loadSprite("balloon", "/aim/balloon.png");
        ctx.loadAseprite("bullet", "/aim/bullet.png", "/aim/bullet.json");
        ctx.loadAseprite("balloon", "/aim/balloon.png", "/aim/balloon.json");
        ctx.loadSprite("explosivoon", "/aim/bomb.png");
        ctx.loadSprite("aim", "/aim/aim.png");
        ctx.loadSprite("cloud", "/aim/cloud.png");
        ctx.loadSprite("mountain", "/aim/mountain.png");

        ctx.loadSound("pop1", "/aim/sounds/balloon_pop-01.mp3");
        ctx.loadSound("pop2", "/aim/sounds/balloon_pop-02.mp3");
        ctx.loadSound("pop3", "/aim/sounds/balloon_pop-03.mp3");
        ctx.loadSound("explode", "/aim/sounds/explosion.wav");
    },
    start(ctx)
    {
        const game = ctx.make();

        const balloons:number = ctx.difficulty == 1 ? ctx.randi(3, 4) 
        : ctx.difficulty == 2 ?  ctx.randi(5, 6) 
        : ctx.difficulty == 3 ?  ctx.randi(7, 9)  : 1;

        let hittedBalloons: GameObj[] = [];

        type BgDeco = {
            mountains: { x: number; y: number, scale: number }[];
        };
        let bgdeco: BgDeco = {
            mountains: []
        };
        for (let m = 0; m < 5; m++)
        {
            let pos = {x: m * ctx.randi(180, 210), y: ctx.randi(ctx.height() - 128, ctx.height() - 64), scale: ctx.rand(1.2, 2.4)};
            bgdeco.mountains.push(pos);
        }

        let mngr = {
            explosivesCount: 0,
            balloonCount: 0,
            hasLost: false,
        };
        let balloonPositions: { x: number; y: number }[] = [];

        function checkForValidPosition(margin: number, obj: GameObj): {x: number, y: number}
        {
            let x: number, y: number, valid: boolean;
            do
            {
                valid = true;
                x = ctx.randi(margin, ctx.width() - (margin + obj.width));
                y = ctx.randi(margin, ctx.height() - (margin + obj.height));

                for(let p of balloonPositions)
                {
                    let dx = p.x - x;
                    let dy = p.y - y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < obj.width)
                    {
                        valid = false;
                        break;
                    }
                }
            }
            while(!valid);

            return { x, y };
        }

        function addBalloon(isExplosive: boolean): void
        {
            const balloon = game.add([
                ctx.sprite(isExplosive ? "explosivoon" : "balloon"),
                ctx.pos(),
                ctx.scale(2, 2),
                ctx.area({
                    shape: new ctx.Rect(ctx.vec2(8, 9), 32, 32)
                }),
                ctx.z(isExplosive ? -9 : -10),

                {
                    speed: ctx.rand(1.2, 1.95),
                    canFly: false,
                },
        
                isExplosive ? "explosivoon" : "balloon",
            ]);

            const bp = checkForValidPosition(32, balloon)
            balloon.pos = ctx.vec2(bp.x, bp.y);
            balloonPositions.push(bp);

            if (!isExplosive)
                balloon.frame = ctx.randi(0, 5);
        
            let oldPosY = balloon.pos.y;
            balloon.onUpdate(() => {
                if (!balloon.canFly)
                    balloon.pos.y = ctx.wave(oldPosY, oldPosY + balloon.height / 2 - 16, ctx.time() * balloon.speed * ctx.speed);
                else
                    balloon.pos.y = ctx.lerp(balloon.pos.y, -256, 0.06);
            });
        }

        const aim = game.add([
            ctx.sprite("aim"),
            ctx.pos(),
            ctx.area({
                scale: 0.85
            }),

            {
                animScale: 1.20,
                animScaleTarget: 1.20,
            },

            ctx.scale(1.5, 1.5),
            ctx.anchor("center"),

            "aim"
        ]);

        game.onUpdate(() => {
            aim.pos.x = ctx.mousePos().x;
            aim.pos.y = ctx.mousePos().y;

            aim.animScale = ctx.lerp(aim.animScale, aim.animScaleTarget, 0.05);

            aim.scaleTo(aim.animScale);
        });

        game.onDraw(() => {
            //ctx.drawSprite
            ctx.drawSprite({
                sprite: "cloud",
                pos: ctx.vec2(-64, -16),
                tiled: true,
                width: ctx.width() + 87
            });

            ctx.drawSprite({
                sprite: "cloud",
                pos: ctx.vec2(0, 8),
                tiled: true,
                width: ctx.width() + 128
            });

            for (const mountain of bgdeco.mountains)
            {
                const width: number = 200;
                const height: number = 96;
                ctx.drawSprite({
                    sprite: "mountain",
                    pos: ctx.vec2(mountain.x, mountain.y),
                    width: width * mountain.scale,
                    height: height * mountain.scale,
                });
            }
        });

        ctx.onButtonPress("click", () => {
            if (ctx.hasWon()) return;
            for (const bln of game.get("balloon").reverse())
            {
                if (bln.isHovering())
                    if (!mngr.hasLost)
                    {
                        ctx.addKaboom(ctx.mousePos());
                        ctx.shakeCam(2.2);
                        ctx.play("pop" + ctx.randi(1, 3));
                        hittedBalloons.push(bln);
                        bln.destroy();
                        
                        if (!ctx.hasWon() && hittedBalloons.length >= mngr.balloonCount)
                        {
                            ctx.win();
                            ctx.wait(0.9, () => {
                                game.get("*").forEach((obj, i, a) => {
                                    //let t = ctx.tween(obj.pos.y, -obj.height + 8, 1, (o) => obj.pos.y = o, ctx.easings.easeInOutBack);
                                    obj.canFly = true;
                                });
                                ctx.wait(1.2, () => ctx.finish());
                            });
                        }
                    }
            };
            
            for (const exp of game.get("explosivoon").reverse())
            {
                if (exp.isHovering())
                    if (!mngr.hasLost)
                    {
                        mngr.hasLost = true;
                        ctx.play("explode");
                        ctx.addKaboom(ctx.mousePos(), {
                            scale: 4.5
                        });
                        ctx.shakeCam(15);
                        exp.destroy();
                        ctx.lose();
                        ctx.wait(0.6, () => {
                            game.get("*").forEach((obj, i, a) => {
                                ctx.play("pop" + ctx.randi(1, 3));
                                ctx.addKaboom(obj.pos);
                                obj.destroy();
                            });
                            ctx.wait(1, () => ctx.finish());
                        });
                    }
            }
        });
    

        for (let b = 0; b <= balloons; b++)
        {
            const explosiveRatio = ctx.difficulty == 1 ? 0.2 : ctx.difficulty >= 2 ?  0.4 : 0.2; 
            mngr.explosivesCount = Math.max(1, Math.floor(balloons * explosiveRatio));
            mngr.balloonCount = balloons - mngr.explosivesCount;
            let isExplosive = b <= mngr.explosivesCount;

            addBalloon(isExplosive);
        }

        ctx.onTimeout(() => {
            if (hittedBalloons.length <= mngr.balloonCount)
            {
                ctx.lose();
                ctx.wait(0.5, () => {
                    game.get("*").forEach((obj, i, a) => {
                        ctx.play("pop" + ctx.randi(1, 3));
                        ctx.addKaboom(obj.pos);
                        obj.destroy();
                    });
                    ctx.wait(1, () => ctx.finish());
                });
            }
        })

        return game;
    },
};

export default aimGame;