<webui-page-segment elevation="10">
    The `<webui-stoic-dreams-logo>` component draws the Stoic Dreams logo, a tilted ring threaded through four spheres, as a scalable vector (SVG) in the site's theme colors: the ring in `--color-title`, and the spheres in `--color-success`, `--color-tertiary`, `--color-secondary`, and `--color-primary`. The `text` and `text2` attributes add one or two lines of words inside the ring, drawn in the logo's perspective: their tops follow the line through the two top spheres, and their bottoms the line through the two bottom spheres. The background is transparent, and the inside of the ring is black, so the words stay readable on any page.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex column gap="4" align="center">
            <!-- Logo with single text line -->
            <webui-stoic-dreams-logo text="App"></webui-stoic-dreams-logo>
            <!-- Logo with two text lines -->
            <webui-stoic-dreams-logo text="Web" text2="UI"></webui-stoic-dreams-logo>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column gap="4" align="center">
            <webui-stoic-dreams-logo text="App"></webui-stoic-dreams-logo>
            <webui-stoic-dreams-logo text="Web" text2="UI"></webui-stoic-dreams-logo>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/stoic-dreams-logo.js" language="javascript" label="stoic-dreams-logo.js"></webui-code>
