<webui-page-segment elevation="10">
    The `<webui-youtube>` component embeds a YouTube video from its id, the part after `v=` in a video's address. It uses YouTube's privacy-enhanced mode, loads only when it scrolls near the screen, and fills its width at 16 by 9. `label` names the video for screen readers, `start` starts it at a number of seconds, and `width` limits its width and centers it.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-youtube video="Gn99fCoEPdM" label="Fabric Engine introduction"></webui-youtube>
    ```
    <webui-page-segment elevation="10">
        <webui-youtube video="Gn99fCoEPdM" label="Fabric Engine introduction"></webui-youtube>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/youtube.js" language="javascript" label="youtube.js"></webui-code>
