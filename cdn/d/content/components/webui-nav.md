<webui-page-segment elevation="10">
    The `<webui-nav>` component dynamically generates a navigation menu from a JSON configuration. It handles nested groups via `<webui-nav-group>` and routing links via `<webui-nav-link>`. It automatically evaluates user roles against defined route requirements to conditionally render available navigation options.
</webui-page-segment>

### Attributes

- **`nav-routes`:** the menu as JSON: a list of items with `name`, `url`, `icon`, and optional `role`, where an item with `children` is a group.
- **`routes`:** the address of a JSON file with that list, such as `/nav.json`, which the app shell uses.

Items with a `role` show only to signed-in users with that role. The menu is a navigation landmark named "Site menu", so screen reader users can jump to it or past it.


<webui-side-by-side>
    ```html:Code Snippet
        <webui-nav nav-routes='[
            {"name": "Home", "url": "/home", "icon": "home"},
            {"name": "Settings", "icon": "gear", "children": [
                {"name": "Profile", "url": "/settings/profile", "icon": "person"},
                {"name": "Security", "url": "/settings/security", "icon": "lock"}
            ]}
        ]'></webui-nav>
    ```
    <webui-page-segment elevation="10">
        <webui-nav nav-routes='[
            {"name": "Home", "url": "/home", "icon": "home"},
            {"name": "Settings", "icon": "gear", "children": [
                {"name": "Profile", "url": "/settings/profile", "icon": "person"},
                {"name": "Security", "url": "/settings/security", "icon": "lock"}
            ]}
        ]'></webui-nav>
    </webui-page-segment>
</webui-side-by-side>

### Loaded from a file

<webui-side-by-side>
    ```html:Code Snippet
        <webui-nav routes="https://cdn.myfi.ws/nav.json"></webui-nav>
    ```
    <webui-page-segment elevation="10">
        <webui-nav routes="https://cdn.myfi.ws/nav.json"></webui-nav>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/nav.js" language="javascript" label="nav.js"></webui-code>
