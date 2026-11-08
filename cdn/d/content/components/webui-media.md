<webui-page-segment elevation="10">
    The `<webui-media>` component shows a small image beside its content, such as a photo beside an introduction or a logo beside a description. Set the image with `src` and `alt`. Leave `alt` out for a decorative image. `size` sets the image's width and height (160 pixels by default), the `round` flag makes it a circle, and the `reverse` flag puts it on the right. When the component is 480 pixels wide or less, the image stacks above the content.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-media src="https://cdn.myfi.ws/img/eg/me_128.webp" alt="Photo of Erik Gassler" size="96" round>
            <h3>Erik Gassler</h3>
            <p>Principal software engineer, and the author of Web UI.</p>
        </webui-media>
    ```
    <webui-page-segment elevation="10">
        <webui-media src="https://cdn.myfi.ws/img/eg/me_128.webp" alt="Photo of Erik Gassler" size="96" round>
            <h3>Erik Gassler</h3>
            <p>Principal software engineer, and the author of Web UI.</p>
        </webui-media>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/media.js" language="javascript" label="media.js"></webui-code>
