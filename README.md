# KAPLAYWARE
yea

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

If you want to use assets created by kaplay, you can use all the assets found in the `crew` package! but you have to prefix your sprite with "@"

```ts
ctx.add([
    ctx.sprite("@bean")
])
```

### Notes:
- Please refrain to use `onMousePress`!! You can use `ctx.onClick()` and `obj.onClick`, but no mouse button (mouse minigames are only allowed to be played with left click)
- If you're making a mouse minigame and you have an object with an area and you'd like for the cursor to not point at this object, you can tag with with "ignorepoint"
```ts
ctx.add([
    ctx.area(),
    "ignorepoint"
])
```