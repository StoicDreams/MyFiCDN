<webui-page-segment elevation="10">
    The `<webui-content>` component dynamically loads and manages HTML or Markdown content. It optimizes page performance by lazy-loading external files only when they enter the viewport and temporarily detaching them from the DOM when they scroll out of view. It supports inline content, caching, preloading, and customizable load delays.
</webui-page-segment>

### Attributes

- **`src`:** the address of the markdown or HTML to load. Without it, the content written inside is used.
- **`load-delay`:** how long, in milliseconds, to wait after it comes into view before loading. The default is 300.
- **`cache`:** keeps the loaded content in the browser's cache, so later visits don't load it again.
- **`preload`:** loads at once, without waiting to come into view.
- **`height`** and **`width`:** set its size. Numbers are pixels.
- **`nodetach`:** keeps its content on the page when it scrolls out of view, rather than setting it aside until it is back. Use it for content that must keep running, such as a video or a form being filled.
- **`nofix`:** lets its height change while its content is set aside, rather than holding the height it had.
- **`slot`** or **`nest`:** keeps the loaded content inside the element. Otherwise the content takes the element's place.


<webui-side-by-side>
    ```html:Code Snippet
        <!-- Inline Content -->
        <webui-content>
            <p>This content is defined inline but still benefits from DOM detachment when out of view.</p>
        </webui-content>

        <!-- Dynamically Loaded Content -->
        <webui-content src="https://cdn.myfi.ws/d/content/lists.md" cache load-delay="500"></webui-content>

        <!-- Preloaded Content (Bypasses Lazy Loading) -->
        <webui-content src="https://cdn.myfi.ws/d/content/quote.md" preload></webui-content>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column>
            <webui-content>
                <p>This content is defined inline but still benefits from DOM detachment when out of view.</p>
            </webui-content>
            <webui-content src="https://cdn.myfi.ws/d/content/lists.md" cache load-delay="500"></webui-content>
            <webui-content src="https://cdn.myfi.ws/d/content/quote.md" preload></webui-content>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Nested, kept on the page, with a set height

<webui-side-by-side>
    ```html:Code Snippet
        <webui-content src="https://cdn.myfi.ws/d/content/quote.md" nest nodetach height="120" load-delay="0"></webui-content>
    ```
    <webui-page-segment elevation="10">
        <webui-content src="https://cdn.myfi.ws/d/content/quote.md" nest nodetach height="120" load-delay="0"></webui-content>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/content.js" language="javascript" label="content.js"></webui-code>
