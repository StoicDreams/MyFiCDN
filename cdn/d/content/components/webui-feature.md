<webui-page-segment elevation="10">
    The `<webui-feature>` component shows a screenshot or a short looping clip beside a heading and text, for showing what a product, project, or feature does. Put the heading and text inside the element.

    - `src` and `alt` set the screenshot, which links to its full-size image. `href` links it somewhere else instead, such as the product's site.
    - `video` shows a looping clip with `<webui-loop-video>` instead, using `src` as its poster. The clip plays only while on screen and has a pause button.
    - Any element with `slot="media"`, such as a `<webui-youtube>`, replaces both.
    - The `reverse` flag puts the media on the right. When the component is narrower than 720 pixels, the media stacks above the text.
</webui-page-segment>

```html:Code Snippet
<webui-feature src="https://cdn.myfi.ws/v/webui/loop-video-demo.webp"
    video="https://cdn.myfi.ws/v/webui/loop-video-demo.mp4"
    alt="Writing a commit message in the Task Proxy Git Controller, with one file excluded">
    <h3>Commit and sync</h3>
    <p>Write a commit message, leave out the files you aren't ready to share, and sync in one step.</p>
</webui-feature>
<webui-feature src="https://cdn.myfi.ws/v/webui/loop-video-demo.webp" alt="The Task Proxy Git Controller" reverse>
    <h3>A screenshot instead</h3>
    <p>Without <code>video</code>, the screenshot shows, linked to its full size.</p>
</webui-feature>
```

<webui-page-segment elevation="10">
    <webui-feature src="https://cdn.myfi.ws/v/webui/loop-video-demo.webp"
        video="https://cdn.myfi.ws/v/webui/loop-video-demo.mp4"
        alt="Writing a commit message in the Task Proxy Git Controller, with one file excluded">
        <h3>Commit and sync</h3>
        <p>Write a commit message, leave out the files you aren't ready to share, and sync in one step.</p>
    </webui-feature>
    <webui-feature src="https://cdn.myfi.ws/v/webui/loop-video-demo.webp" alt="The Task Proxy Git Controller" reverse>
        <h3>A screenshot instead</h3>
        <p>Without <code>video</code>, the screenshot shows, linked to its full size.</p>
    </webui-feature>
</webui-page-segment>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/feature.js" language="javascript" label="feature.js"></webui-code>
