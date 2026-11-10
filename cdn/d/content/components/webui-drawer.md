<webui-page-segment elevation="10">
    The `<webui-drawer>` component provides a slide-out panel often used for navigation menus or contextual tools. It can be docked to remain continuously visible or set to overlay the page. Users can manipulate its position if the `data-moveable` attribute is present, and toggle its docked state if `data-dockable` is applied.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-drawer class="elevation-10" docked="true" data-moveable data-dockable id="demo-drawer">
            <webui-flex slot="header" justify="center">
                <h3>Menu</h3>
            </webui-flex>
            <webui-nav-link url="/home" name="Home" icon="home"></webui-nav-link>
            <webui-nav-link url="/settings" name="Settings" icon="gear"></webui-nav-link>
        </webui-drawer>
    ```
    <webui-page-segment elevation="10" style="position:relative; min-height: 250px;">
        <webui-drawer class="elevation-10" docked="true" data-moveable data-dockable id="demo-drawer">
            <webui-flex slot="header" justify="center">
                <h3>Menu</h3>
            </webui-flex>
            <webui-nav-link url="/home" name="Home" icon="home"></webui-nav-link>
            <webui-nav-link url="/settings" name="Settings" icon="gear"></webui-nav-link>
        </webui-drawer>
    </webui-page-segment>
</webui-side-by-side>

### Closing

A drawer with `data-dockable` also shows a Close button beside its Dock button. It closes an open drawer, and undocks a docked drawer first so it stays closed.

### Resizing

Add `resizable` to a left or right drawer to let users drag its inner edge to make it wider or narrower. Double click the edge to go back to the width its content needs. The edge can also be focused and resized with the arrow keys.

The chosen width is kept in the `width` attribute, in pixels, so add `width` to `data-state` to remember it between visits.

| Attribute | Default | Limit |
|---|---|---|
| `docked-min-width` | `240px` | Narrowest while docked |
| `docked-max-width` | `90%` | Widest while docked |
| `undocked-min-width` | `240px` | Narrowest while undocked |
| `undocked-max-width` | `90%` | Widest while undocked |

Limits are pixels, such as `320` or `320px`, or a share of the window, such as `50%` or `50vw`. A drawer is never wider than the window, and when a minimum is larger than the maximum, the maximum wins. The saved width is kept as dragged, and shown within the limits of the drawer's current state, so docking or undocking can show it narrower or wider.

```html
<webui-drawer slot="right" data-dockable resizable data-state="slot|width"
    docked-min-width="300" docked-max-width="50%" undocked-max-width="90%">
</webui-drawer>
```

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/drawer.js" language="javascript" label="drawer.js"></webui-code>
