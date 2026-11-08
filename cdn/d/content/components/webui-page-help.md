<webui-page-segment elevation="10">
    The `<webui-page-help>` component keeps a page's help out of the way until it is wanted. It shows a small **Help** bubble floating at the bottom right of the window, just above the app's footer. Clicking the bubble grows it into a panel showing the component's content. The close button, or Escape while using the panel, shrinks it back.

    The panel does not block the page, so it can stay open as a reference while the page is used. Drag the bubble, or the panel by its header, to move either one out of the way, and drag any edge or corner of the panel to resize it. The panel first opens with its bottom right corner at the bubble, and grows upward as its content loads. Where they were left, and the panel's size, are remembered with the user's other site data, and both are kept inside the window when it is resized. Without any content the bubble is not shown.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-page-help heading="Example Page Help" storage-key="webui-page-help-demo">
            <p>Help content for this page goes here, including other components.</p>
            <webui-tabs theme="info">
                <webui-button slot="tabs">Getting Started</webui-button>
                <webui-content slot="content" nodetach>Start here.</webui-content>
                <webui-button slot="tabs">Tips</webui-button>
                <webui-content slot="content" nodetach>Drag the bubble to move it.</webui-content>
            </webui-tabs>
        </webui-page-help>
    ```
    <webui-page-segment elevation="10">
        Look for the **Help** bubble at the bottom right of the window.
        <webui-page-help heading="Example Page Help" storage-key="webui-page-help-demo">
            <p>Help content for this page goes here, including other components.</p>
            <webui-tabs theme="info">
                <webui-button slot="tabs">Getting Started</webui-button>
                <webui-content slot="content" nodetach>Start here.</webui-content>
                <webui-button slot="tabs">Tips</webui-button>
                <webui-content slot="content" nodetach>Drag the bubble to move it.</webui-content>
            </webui-tabs>
        </webui-page-help>
    </webui-page-segment>
</webui-side-by-side>

### Attributes

| Attribute | Description |
|---|---|
| `label` | Text on the bubble. Defaults to `Help`. |
| `heading` | Title of the dialog. Defaults to the label. |
| `icon` | Icon on the bubble. Defaults to `question`. |
| `theme` | Color theme of the bubble and the dialog's header. |
| `storage-key` | Where the bubble's position is saved. The panel's position and size are saved under the same key followed by `-panel`. Pages sharing a key share a position, which is the default so the help stays put from page to page. |
| `right`, `bottom` | Starting distance from the window's edges, instead of just above the footer. |

### Methods

| Method | Description |
|---|---|
| `open()` | Opens the help panel. |
| `close()` | Closes the help panel. |
| `toggle()` | Opens the help panel when it is closed, and closes it when it is open. |
| `isOpen()` | Whether the help panel is open. |
| `resetPosition()` | Forgets where the bubble and panel were moved and the panel's size, and returns them to the bottom right. |

### CSS Variables

| Variable | Description |
|---|---|
| `--page-help-width` | Starting width of the panel, until it is resized. Defaults to `600px`, or less in a narrow window. |

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/page-help.js" language="javascript" label="page-help.js"></webui-code>
