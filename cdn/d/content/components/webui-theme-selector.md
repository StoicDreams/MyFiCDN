<webui-page-segment elevation="10">
    The `<webui-theme-selector>` component is a header button that lets visitors choose between a site's themes. List each theme as an `<option>` inside it, with a `value` and an optional `data-colors` list of swatch colors. The option with an empty value is the site's default theme. Give options a `data-category`, such as `Organic` or `Space`, and the list becomes a tab for each category, with its light themes beside its dark ones (`data-scheme`) in split panes, and each theme a tile drawn in its colors: list `data-colors` as background, title, primary, secondary, tertiary, active, and button. A theme with its own look can show it on its tile too: `data-font` is its heading font, and `data-texture` and `data-mark` are image addresses for its page texture and the mark beside its headings.

    Clicking the button lists the themes in the drawer named by `data-toggleclass` (such as `.shared|open`, the same drawer `webui-alerts` uses), or in a dialog when there is none. `data-title` sets the heading above the list.

    Choosing a theme sets `data-theme` on the `<html>` element and saves the choice in the `session-theme` data key. The loader reads that key on startup and sets `data-theme` before the page draws, so a returning visitor never sees the default theme flash first. The browser's `theme-color` meta tag is updated to the theme's `--color-background`. A saved theme the site no longer lists falls back to the default.

    Define each theme in the site's CSS by setting the theme variables under `:root[data-theme="name"]`, plus any other styles the theme changes. Keep the default theme in the plain `:root` block.
</webui-page-segment>

```css:Theme CSS
:root[data-theme="granite"] {
    --color-background: #1b1c1e;
    --color-background-offset: #e8e4dc;
    --color-tertiary: #c9a46a;
    --color-tertiary-offset: #1b1c1e;
}
```

<webui-side-by-side>
    ```html:Code Snippet
        <webui-theme-selector title="Choose a theme" data-title="Theme">
            <option value="" data-colors="#14111c #ff5c8a #ff8a3d">Voxel Dusk</option>
            <option value="granite" data-colors="#1b1c1e #c9a46a #e8e4dc">Granite</option>
            <option value="graphite" data-colors="#f4f1e9 #2b2b2b #2f5d8a">Graphite</option>
        </webui-theme-selector>
    ```
    <webui-page-segment elevation="10">
        <webui-theme-selector panel>
            <option value="" data-colors="#14111c #ff5c8a #ff8a3d">Voxel Dusk</option>
            <option value="granite" data-colors="#1b1c1e #c9a46a #e8e4dc">Granite</option>
            <option value="graphite" data-colors="#f4f1e9 #2b2b2b #2f5d8a">Graphite</option>
        </webui-theme-selector>
    </webui-page-segment>
</webui-side-by-side>

The example on the right is the list the button opens, shown with the `panel` flag. These docs don't define the example themes, so choosing one here only changes the selection.

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/theme-selector.js" language="javascript" label="theme-selector.js"></webui-code>
