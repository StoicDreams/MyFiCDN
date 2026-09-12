<webui-page-segment elevation="10">
    The `<webui-nav-link>` component renders an individual navigation item. It maps a display name and icon to a destination URL. It subscribes to page path changes to automatically highlight its active state based on the current application routing.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex column>
            <webui-nav-link name="Dashboard" url="/dashboard" icon="chart-line"></webui-nav-link>
            <webui-nav-link name="Messages" url="/messages" icon="envelope"></webui-nav-link>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column>
            <webui-nav-link name="Dashboard" url="/dashboard" icon="chart-line"></webui-nav-link>
            <webui-nav-link name="Messages" url="/messages" icon="envelope"></webui-nav-link>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/nav-link.js" language="javascript" label="nav-link.js"></webui-code>
