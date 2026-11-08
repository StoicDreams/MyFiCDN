
<webui-page-segment elevation="10">
    This component displays documentation for Web UI's web components, such as `<webui-alert>` and `<webui-table>`.

    [&lt;webui-tabs&gt;](/components#webui-tabs) is used to display the list of components, with each component's documentation displayed in a separate tab. A link in the documentation to another component, such as `/components#webui-tabs`, opens that component's tab.
</webui-page-segment>

### Attributes

- **`height`** and **`max-height`:** set the height of the list. Numbers are pixels.
- **`exclude`:** component names to leave out, separated by spaces or commas, such as components an app's pages cannot use.
- **`nohash`:** choosing a tab leaves the url alone. Use it where the components are a reference beside other content, such as in a help panel.

```html:Embedded as a reference
<webui-components nohash exclude="app-template webui-app webui-app-config"></webui-components>
```

<webui-side-by-side>
    ```html:Code Snippet
        <webui-components></webui-components>
    ```
    <webui-page-segment elevation="10">
        This page is a live example of the `<webui-components>` component.
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/components.js" language="javascript" label="components.js"></webui-code>
