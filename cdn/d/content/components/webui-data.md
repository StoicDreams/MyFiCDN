<webui-page-segment elevation="10">
    The `<webui-data>` component initializes and manages application state data. It extracts values from custom data attributes or nested `<template>` elements. Supported template slots include `json`, `html`, and `text`, utilizing the `name` attribute as the data key. It also provides built-in methods like `pushItem` and `setDefault` for advanced state manipulation.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <!-- Attribute-based Data Initialization -->
        <webui-data data-page-title="Home" data-theme-config='{"dark": true}'></webui-data>

        <!-- Template-based Data Initialization -->
        <webui-data>
            <template slot="json" name="user-profile">
                {
                    "name": "Jane Doe",
                    "role": "Admin"
                }
            </template>
            <template slot="html" name="welcome-message">
                <strong>Welcome back!</strong>
            </template>
        </webui-data>

        <!-- Array Push Configuration -->
        <webui-data data-subscribe="new-item-trigger:pushItem">
            <template slot="json" name="new-item-trigger" data-update="item-list">{}</template>
        </webui-data>
    ```
    <webui-page-segment elevation="10">
        *   **Attribute Initialization**: Attributes prefixed with `data-` (excluding reserved terms like `subscribe`, `trigger`, and `click`) are parsed as JSON or strings and injected into the global state.
        *   **Template Initialization**: `<template>` elements define complex data structures (`json`, `html`, or `text`) assigned to the state key specified by the `name` attribute.
        *   **Array Manipulation**: Utilizes `data-update` on a template to target an array in the state, allowing external triggers to push new items into it via the `pushItem` method.
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/data.js" language="javascript" label="data.js"></webui-code>
