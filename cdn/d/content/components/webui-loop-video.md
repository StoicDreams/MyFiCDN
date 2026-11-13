<webui-page-segment elevation="10">
    The `<webui-loop-video>` component shows a short, silent video that plays on a loop, in place of a screenshot, to show an action from start to finish. It plays only while at least a quarter of it is on screen, and pauses when scrolled away. A button in its corner pauses and plays it. Visitors who ask their system for less motion see the poster until they press Play. If the video cannot load, the poster shows as an image.

    Set the video with `src`, a still with `poster` (the last frame works well, since it shows the result), and describe what it shows with `alt`, as you would for an image. `width` and `height` reserve its space before it loads. Keep loops short, a few seconds to show one action, and record them from your site's real UI when publishing so they stay current.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-loop-video src="https://cdn.myfi.ws/v/webui/loop-video-demo.mp4"
            poster="https://cdn.myfi.ws/v/webui/loop-video-demo.webp"
            alt="Writing a commit message in the Task Proxy Git Controller, with one file excluded"
            width="1280" height="800"></webui-loop-video>
    ```
    <webui-page-segment elevation="10">
        <webui-loop-video src="https://cdn.myfi.ws/v/webui/loop-video-demo.mp4"
            poster="https://cdn.myfi.ws/v/webui/loop-video-demo.webp"
            alt="Writing a commit message in the Task Proxy Git Controller, with one file excluded"
            width="1280" height="800"></webui-loop-video>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/loop-video.js" language="javascript" label="loop-video.js"></webui-code>
