<webui-page-segment elevation="10">
    The `<webui-stoic-dreams-logo>` component draws the Stoic Dreams logo as a scalable vector (SVG): its tilted black ring threaded through red, blue, and green spheres in the logo's own colors, around a large sphere in the site's `--color-primary`. The `text` and `text2` attributes add one or two lines of words in front of the large sphere, white with a black edge, drawn in the logo's perspective so they lean with the ring. The background is transparent, and the image is trimmed to the logo, so it fills the space it is given. Screen readers hear it as a picture named by `title`, or by its words and "Logo", such as "Web UI Logo".
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

### Named by its title

<webui-side-by-side>
    ```html:Code Snippet
        <webui-stoic-dreams-logo text="Docs" title="Stoic Dreams documentation"></webui-stoic-dreams-logo>
    ```
    <webui-page-segment elevation="10">
        <webui-stoic-dreams-logo text="Docs" title="Stoic Dreams documentation"></webui-stoic-dreams-logo>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/stoic-dreams-logo.js" language="javascript" label="stoic-dreams-logo.js"></webui-code>
