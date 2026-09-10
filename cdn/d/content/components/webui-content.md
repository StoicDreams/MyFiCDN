<webui-page-segment elevation="10">
    The `<webui-content>` component dynamically loads and manages HTML or Markdown content. It optimizes page performance by lazy-loading external files only when they enter the viewport and temporarily detaching them from the DOM when they scroll out of view. It supports inline content, caching, preloading, and customizable load delays.
</webui-page-segment>

## Content Variations

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

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/content.js" language="javascript" label="content.js"></webui-code>
