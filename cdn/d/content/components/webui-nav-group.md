<webui-page-segment elevation="10">
    The `<webui-nav-group>` component creates a collapsible container for nested navigation items. It manages an open/close state, displays a configurable icon, and is typically generated and managed within a `<webui-nav>` hierarchy to organize related `<webui-nav-link>` elements.
</webui-page-segment>

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

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/nav-group.js" language="javascript" label="nav-group.js"></webui-code>
