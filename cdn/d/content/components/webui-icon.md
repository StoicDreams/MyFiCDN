<webui-page-segment elevation="10">
    The `<webui-icon>` component renders scalable vector icons and emojis. It supports custom styling attributes like `theme`, `shape`, `stroke`, `shade`, `rotate`, and `bordered`. Icons can be configured using a single piped string format (e.g., `icon="circle_bell|fill|theme:info"`) for clean code reuse across components.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex gap="4" align="center">
            <!-- Standard Icon -->
            <webui-icon icon="home" theme="primary"></webui-icon>

            <!-- Piped Configuration Icon -->
            <webui-icon icon="bell|fill|shade:tri|theme:success" width="32"></webui-icon>
            
            <!-- Icon with Backing Shape -->
            <webui-icon icon="circle_star|fill|backing" theme="warning"></webui-icon>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex gap="4" align="center" justify="center">
            <webui-icon icon="home" theme="primary"></webui-icon>
            <webui-icon icon="bell|fill|shade:tri|theme:success" width="32"></webui-icon>
            <webui-icon icon="circle_star|fill|backing" theme="warning"></webui-icon>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Variations

Slashes, containers, directions, and fills are flags on any icon, so there is no separate icon for each variation. Add them as attributes, or after the icon name with `|`.

- **`ban`:** crosses the icon out with a slash, leaving a gap in the background color, as in `eye|ban` or `circle|ban`.
- **A shape with `bordered`:** draws the icon inside a shape. Put the shape before the icon name with an underscore, as in `circle_check|bordered`. The shape can also go after the name, as in `check_circle|bordered`, but shape first is the standard. Shapes are `circle`, `square`, `shield`, `triangle`, `octo`, `badge`, `cloud`, `file`, `book`, `gear`, `chart`, `calendar`, and `heart`, and emojis take a shape first only, as in `circle_emoji-rocket|inverted`. A file or cloud with an icon inside replaces icons like a code file or a cloud upload: `file_code|bordered`, `cloud_arrow|rotate:-90|bordered`. A book with a person inside is an address book, `book_user|bordered`, and a gear with an icon inside marks its settings, as in `gear_bell|bordered`. A calendar with an icon inside dates it, as in `calendar_check|bordered`, `calendar_plus|bordered`, or `calendar_grid|bordered`. `chart` draws the axes down the left and along the bottom, for charts such as `chart_bar|bordered`, `chart_line|bordered`, `chart_area|bordered`, and `chart_gantt|bordered`. It is only a line, so use it with `bordered`. The `shape` attribute, as in `shape="circle"`, still works.
- **`backing`:** fills the shape lightly behind the icon, as in `circle_exclamation|backing|bordered`.
- **`inverted`:** fills the shape with the icon color and draws the icon in the background color, as in `circle_heart|inverted`.
- **`rotate`:** turns the icon by degrees, as in `arrow|rotate:90` for a down arrow, or `chevron|rotate:180` for left.
- **`flip`:** mirrors the icon, left to right by default, or `flip:y` top to bottom and `flip:both`. For example, `undo|flip` is redo.
- **`fill`:** fills the icon's shapes, as in `heart|fill`.
- **`shade`:** draws details in lighter shades of the color, `duo` or `tri`, as in `bell|fill|shade:tri`.
- **`stroke`:** sets the line weight, `thin`, `thick`, or a number, as in `star|stroke:thin`.
- **`theme`:** colors the icon with a theme, as in `star|theme:warning`.

Inside a shape the icon shrinks to fit, keeping its line weight. Set `--icon-glyph-scale` to change how much, such as `0.5`.

<webui-flex gap="4" align="center" wrap>
    <webui-icon icon="eye|ban" width="40"></webui-icon>
    <webui-icon icon="circle_check|bordered" width="40"></webui-icon>
    <webui-icon icon="triangle_exclamation|bordered" width="40"></webui-icon>
    <webui-icon icon="shield_check|bordered" width="40"></webui-icon>
    <webui-icon icon="circle_exclamation|backing|bordered" width="40"></webui-icon>
    <webui-icon icon="circle_heart|inverted" width="40"></webui-icon>
    <webui-icon icon="arrow|rotate:90" width="40"></webui-icon>
    <webui-icon icon="undo|flip" width="40"></webui-icon>
    <webui-icon icon="file_code|bordered" width="40"></webui-icon>
    <webui-icon icon="file_diff|bordered" width="40"></webui-icon>
    <webui-icon icon="cloud_arrow|rotate:-90|bordered" width="40"></webui-icon>
    <webui-icon icon="ellipsis|rotate:90" width="40"></webui-icon>
</webui-flex>

### Changing Icons

Set a new `icon`, or call `setIcon`, and the icon morphs into it, because every icon is drawn the same way: up to 10 paths, each a start point and 11 curves. Paths an icon does not use shrink to its center.

<webui-flex gap="4" align="center">
    <webui-button theme="secondary" data-trigger="icon-demo" data-value="hamburger">Menu</webui-button>
    <webui-button theme="secondary" data-trigger="icon-demo" data-value="xmark">Close</webui-button>
    <webui-button theme="secondary" data-trigger="icon-demo" data-value="gear">Settings</webui-button>
    <webui-button theme="secondary" data-trigger="icon-demo" data-value="heart">Heart</webui-button>
    <webui-icon icon="hamburger" data-subscribe="icon-demo:setIcon" width="48"></webui-icon>
</webui-flex>

Browse every icon with `<webui-icon-search>`.

### Icon Files

Each icon is a `.webui` file in `https://cdn.myfi.ws/icons/`. The first line is `WEBUI-ICON-` and the icon's name. Each other line is one path, drawn in a 200 unit square from -100 to 100:

```text:bell.webui
WEBUI-ICON-BELL
M-62 40Q-54 34 -50 23Q...z
bi|M0 68Q-7 68 -13 64Q...z
```

- **Shade:** start a line with `bi` or `tri` to draw it in the second or third shade, which keeps details visible when the icon is filled.
- **Stroke width:** start a line with a number, such as `20|`, to draw it thicker than the icon's stroke. A shade and a width can be combined, as in `bi|20|`.
- **Curves:** every path is exactly a start point and 11 quadratic curves, ending with `z`. Browsers only animate between paths with the same commands, so a path with any other number of curves does not morph.

The framework's icons are built from shapes by `tools/icons` in the MyFiCDN repository, with `npm run icons`. `<webui-icon-creator>` edits single icons point by point.

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/icon.js" language="javascript" label="icon.js"></webui-code>
