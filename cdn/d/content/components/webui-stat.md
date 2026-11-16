<webui-page-segment elevation="10">
    The `<webui-stat>` component shows a key number or short result in large type, such as a response time or a count, with a `label` under it and an optional description inside the element. Stats in a `<webui-flex wrap>` sit side by side and wrap onto new rows as space runs out. `width` sets the width each stat aims for (220 pixels by default).

    The value is filled with the `--fill-accent` variable, the tertiary color by default. Set it to a gradient, on the page or on a stat, for a stylized look. A `theme` attribute colors the stat's background.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex wrap gap="2">
            <webui-stat value="< 100 ms" label="Per request" theme="primary">
                A response time standard held across hundreds of reports.
            </webui-stat>
            <webui-stat value="2x" label="Calls at once" theme="primary"
                style="--fill-accent:linear-gradient(90deg, #ff5c8a, #ff8a3d)">
                With a gradient fill.
            </webui-stat>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex wrap gap="2">
            <webui-stat value="< 100 ms" label="Per request" theme="primary">
                A response time standard held across hundreds of reports.
            </webui-stat>
            <webui-stat value="2x" label="Calls at once" theme="primary"
                style="--fill-accent:linear-gradient(90deg, #ff5c8a, #ff8a3d)">
                With a gradient fill.
            </webui-stat>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/stat.js" language="javascript" label="stat.js"></webui-code>
