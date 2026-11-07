<webui-page-segment elevation="10">
    The `<webui-page-help>` component keeps a page's help out of the way until it is wanted. It shows a small **Help** bubble floating at the bottom right of the window, just above the app's footer. Clicking the bubble grows it into a dialog showing the component's content, and Escape, the close button, or a click outside the dialog shrinks it back.

    The bubble can be dragged anywhere if it is in the way. Its position is remembered with the user's other site data, and it is kept inside the window when the window is resized. Without any content the bubble is not shown.
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
| `storage-key` | Where the dragged position is saved. Pages sharing a key share a position, which is the default so the bubble stays put from page to page. |
| `right`, `bottom` | Starting distance from the window's edges, instead of just above the footer. |

### Methods

| Method | Description |
|---|---|
| `open()` | Opens the help dialog. |
| `close()` | Closes the help dialog. |
| `resetPosition()` | Forgets the dragged position and returns the bubble to its starting place. |

### CSS Variables

| Variable | Description |
|---|---|
| `--page-help-width` | Width of the dialog. Defaults to `min(1000px, 94vw)`. |

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/page-help.js" language="javascript" label="page-help.js"></webui-code>
