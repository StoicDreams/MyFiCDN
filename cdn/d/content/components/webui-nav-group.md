<webui-page-segment elevation="10">
    The `<webui-nav-group>` component creates a collapsible container for nested navigation items. It manages an open/close state, displays a configurable icon, and is typically generated and managed within a `<webui-nav>` hierarchy to organize related `<webui-nav-link>` elements. When the page being shown is one of its links, the group opens by itself so visitors can see where they are. It never closes on its own.

    `data-bind="key:setShow"` opens or closes the group from data and saves a person opening or closing it, and `data-subscribe="key:setShow"` only follows the data. Only `true`, `"true"`, `1`, and `"1"` open it, so text such as `"false"` or `""` from storage keeps it closed. In the example below, the toggle and the group share one key.
</webui-page-segment>

### Attributes

- **`name`:** the group's text, which also names its button.
- **`icon`:** an icon before the name.
- **`show`:** starts the group open.
- **`disabled`:** keeps the group from opening or closing.


<webui-side-by-side>
    ```html:Code Snippet
        <webui-nav-group name="User Settings" icon="gear">
            <webui-nav-link name="Profile" url="/profile" icon="person"></webui-nav-link>
            <webui-nav-link name="Preferences" url="/preferences" icon="sliders"></webui-nav-link>
        </webui-nav-group>
    ```
    <webui-page-segment elevation="10">
        <webui-nav-group name="User Settings" icon="gear">
            <webui-nav-link name="Profile" url="/profile" icon="person"></webui-nav-link>
            <webui-nav-link name="Preferences" url="/preferences" icon="sliders"></webui-nav-link>
        </webui-nav-group>
    </webui-page-segment>
</webui-side-by-side>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-toggle-icon data-bind="demo-nav-group-open" label="Open the group" icon-on="folder-open" icon-off="folder"></webui-toggle-icon>
        <webui-nav-group name="Bound Group" icon="link" data-bind="demo-nav-group-open:setShow">
            <webui-nav-link name="Profile" url="/profile" icon="person"></webui-nav-link>
        </webui-nav-group>
    ```
    <webui-page-segment elevation="10">
        <webui-toggle-icon data-bind="demo-nav-group-open" label="Open the group" icon-on="folder-open" icon-off="folder"></webui-toggle-icon>
        <webui-nav-group name="Bound Group" icon="link" data-bind="demo-nav-group-open:setShow">
            <webui-nav-link name="Profile" url="/profile" icon="person"></webui-nav-link>
        </webui-nav-group>
    </webui-page-segment>
</webui-side-by-side>

### Open at start

<webui-side-by-side>
    ```html:Code Snippet
        <webui-nav-group name="Open at Start" icon="folder-open" show>
            <webui-nav-link name="Profile" url="/profile" icon="person"></webui-nav-link>
        </webui-nav-group>
    ```
    <webui-page-segment elevation="10">
        <webui-nav-group name="Open at Start" icon="folder-open" show>
            <webui-nav-link name="Profile" url="/profile" icon="person"></webui-nav-link>
        </webui-nav-group>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/nav-group.js" language="javascript" label="nav-group.js"></webui-code>
