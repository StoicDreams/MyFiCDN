# Icon builder

Builds the icons in `cdn/icons` from shapes, so they share one style and stay valid for `webui-icon`.

```bash
npm run icons        # write cdn/icons/*.webui and update cdn/icons/all.json
npm run icons:check  # only check the designs
```

- `icons.mjs`, `icons-more.mjs`, and `icons-sets.mjs` (office, developer, social, and game icons) hold the designs, and `parts.mjs` shapes they share. Each icon is a name, its search tags, and its paths. Wrap a path in `bi(...)` or `tri(...)` for the second or third shade, or `['20', path]` for a wider stroke.
- `lib.mjs` has the shapes: `line`, `polyline`, `polygon`, `rect`, `circle`, `ellipse`, `arc`, `dot`, and `P(x, y)` for drawing with `L` (line), `Q` (curve), and `A` (arc). `move`, `scale`, `rotate`, and `mirror` copy a path.

## Style

- Coordinates run from -100 to 100, with y pointing down. Draw inside -75 to 75, so icons fit inside every backing shape.
- Strokes are 10 units wide with round ends and joins. Containers are 128 units wide with 12 unit corners, and circles have a radius of 70.
- Make the outline one closed shape where possible, so it fills cleanly, and draw details inside it with `bi`.
- Give an icon with several parts a second shade, and a third where parts step back, so the Shade option adds depth. Keep the main part in the first shade: an arrow's head (its shaft is `bi`, as `shadedArrow` draws curved ones), the front link of a chain, the nearest arc of a feed. Symmetric marks such as `plus`, `xmark`, `equals`, and `pause` stay one shade.
- Give a single shape a detail in the second shade where one fits: a gloss mark in a top corner or curve (`heart`, `cloud`, `comment`, `droplet`), a split (`shield`, `location-arrow`), or a feature (moon craters, a snowline, an inner star). Leave it one shade when the detail would change what the icon means, as lines in `comment` would make it `feedback`. Also leave basic shapes, single strokes (`check`, `chevron`, `minus`), and shapes too narrow to keep a gap either side of the detail, such as `bolt`.
- Keep the directions sites rely on: `arrow` and `chevron` point right, and `caret` points up. Sites turn them with the `rotate` attribute.
- Do not add an icon that is only a variation of another. `webui-icon` draws these itself: a slash (`eye|ban`), a container (`circle_check|bordered`, or `file_code|bordered` and `cloud_arrow|rotate:-90|bordered`), a turn (`arrow|rotate:90`), and a mirror (`undo|flip`). The build rejects names that look like one, such as `eye-slash`, `circle-check`, `file-code`, `cloud-arrow-up`, `arrow-left`, or `ellipsis-vertical`. Variations it cannot draw, such as a plus beside a person in `user-plus`, are separate icons.

## Limits

`webui-icon` morphs between icons by animating each path, which only works when every path has the same commands. So every path is a start point and exactly 11 quadratic curves:

- Lines become curves with their control point on the line, arcs become curves of up to 45 degrees (`A(..., 90)` allows 90), and the longest curves are split until there are 11. Splitting never changes the shape.
- Each rounded corner of a polygon takes 2 curves and each sharp corner 1, so a closed shape can have at most 5 rounded corners. The build reports a shape that needs more.
- Lines are traced out and back, since every path is closed. A long line drawing is split into several paths automatically.
- An icon has at most 10 paths.

`KEEP` in `icons.mjs` lists icons whose artwork is kept as drawn, such as brand logos. Edit those with the Icon Creator.

The outlines for the cloud and file shapes, as in `cloud_arrow` and `file_code`, are `cloudOutline` and `fileOutline` in `parts.mjs`. After changing one, run `node tools/icons/shapes.mjs` and copy its output into `defCloud` and `defFile` in `cdn/webui/icon.js`.
