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

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/drawer.js" language="javascript" label="drawer.js"></webui-code>
