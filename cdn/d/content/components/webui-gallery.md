<webui-page-segment elevation="10">
    The `<webui-gallery>` component builds an interactive gallery of images and videos: a main viewer above a responsive grid of thumbnail cards. Clicking a card, or pressing Enter or Space on it, shows that item in the viewer. Images show as images, and videos play with controls, using their poster as the card.
    Give it items either way:
    - **Inside it:** write `<img>`, `<video>`, `<webui-loop-video>`, or `<webui-image-stack>` elements in the gallery. Each item's name is its `title`, `alt`, or `aria-label`, and a video's `poster` becomes its card. A stack's first image is its card, and the viewer shows the whole stack. The gallery shows them in its own layout.
    - **From JSON:** set `src` to a JSON endpoint returning an array of items, such as `[{"name": "...", "src": "..."}]`. Add `"poster"` for a video's card. An item is a video when its `src` is a video file (`.mp4`, `.webm`, `.ogv`, `.mov`), or when it has `"type": "video"`.
    Several galleries can share a page, and each keeps its own selection.
</webui-page-segment>

## From JSON

<webui-side-by-side>
    ```html:Code Snippet
        <webui-gallery src="https://cdn.myfi.ws/api/gallery.json" card-width="150"></webui-gallery>
    ```
    <webui-page-segment elevation="10">
        <webui-gallery src="https://cdn.myfi.ws/api/gallery.json" card-width="150"></webui-gallery>
    </webui-page-segment>
</webui-side-by-side>

## Items Written Inside

<webui-side-by-side>
    ```html:Code Snippet
        <webui-gallery card-width="150">
            <img src="https://www.stoicdreams.com/img/screenshots/pages/root.png" alt="Stoic Dreams home page">
            <video src="https://www.taskproxy.com/video/loops/git-branches.mp4" poster="https://www.taskproxy.com/video/loops/git-branches.webp" title="Task Proxy's Git branches"></video>
        </webui-gallery>
    ```
    <webui-page-segment elevation="10">
        <webui-gallery card-width="150">
            <img src="https://www.stoicdreams.com/img/screenshots/pages/root.png" alt="Stoic Dreams home page">
            <video src="https://www.taskproxy.com/video/loops/git-branches.mp4" poster="https://www.taskproxy.com/video/loops/git-branches.webp" title="Task Proxy's Git branches"></video>
        </webui-gallery>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/gallery.js" language="javascript" label="gallery.js"></webui-code>
