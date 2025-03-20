# KAPLAYWARE
yea

## Credits
- [STRIKE! art](/games/amyspark-ng/assets/sprites/strike): [DevkyRD](https://devkyrd.newgrounds.com)

## How to add game????
To make a new game do:
```sh
$ npm run create-game {yourname}:{gamename}
# for example
$ npm run create-game wario:squeeze
```

When you make it the urlPrefix for your game will automatically be created from your user folder, so it will look something like this
`games/wario/assets`

Then you can reference this folder in your games like
```ts
{
    load(ctx) {
        ctx.loadSprite("mario", "/sprites/mario.png");
    },
}
```

## How to dev?!
You can run dev server and play with:
```sh
$ npm install
$ npm run dev
```

Or to focus only on the development of your own game, you can do:
```sh
$ npm run dev {yourname}:{gamename}
# for example
$ npm run dev wario:squeeze
```
> There is a one more way to limit games, more in [Advanced testing](#advanced-testing)

## Default assets
If you want to use assets created by kaplay, you can use all the assets found in the [crew package](https://github.com/kaplayjs/crew) ! but you have to prefix your sprite with "@"
```ts
ctx.add([
    ctx.sprite("@bean")
])
```

## Mouse games
If you're going to make a game that uses the mouse, you need to specify it on your game data, it would look something like this
```ts
const newGame: Minigame = {
    // ...
    input: { cursor: { hide: true } },
    start(ctx) {
        // ...
    }
}
```

You can also use `hidden: true` If you're going to make a game that uses a custom cursor, for more info you can check the [SWAT!](/games/amyspark-ng/swat.ts) minigame or the [HIT!](/games/amyspark-ng/hit.ts) minigame, which use a custom cursor (hand sprites)

- Please refrain to use `onMousePress`!! You can use `ctx.onClick()` and `obj.onClick`, but no mouse button (mouse minigames are only allowed to be played with left click)
```ts
game.onMousePress("right", () => bean.jump()) // BAD!! Don't do this :(
obj.onClick(() => )
ctx.onButtonPress("click", () => bean.jump()) // GOOD!! Do this :)
```
- If you're making a mouse minigame and you have an object with an area and you'd like for the cursor to not point at this object, you can tag it with with "ignorepoint"
```ts
ctx.add([
    ctx.area(),
    "ignorepoint"
])
```

### Debug keybinds:
* `Q` - Restart minigame
* `Shift + Q` - Skip minigame
* `Shift + W` - Restart with speed up
* `1, 2, 3` - Restart with new difficulty (wanted to make it with shift but it's not working)
* If you press F2 you'll get a panel that shows some kaplayware info (inputEnabled, score, lives, speed, difficulty, etc)

![alt text](debug.png)

## Advanced testing
You can limit the minigames played by their `gameID` with `.env.development` file in the root folder. Copy `.env.development.example` file and save it without `.example` suffix. Then list games in `VITE_ONLY_MINIGAMES` like `{yourname}:{gamename}`, one per line.

For example:

```sh
# Include only these minigames
VITE_ONLY_MINIGAMES="
  amyspark-ng:spam
  amyspark-ng:connect
"
```

Remember to re-run the dev server when you modify it.
