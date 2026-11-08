<webui-page-segment elevation="10">
    The `<webui-switch>` component shows a few options as a row of joined buttons, and selects one of them. List the options in the `options` attribute, separated by `|`. The first option is selected unless `value` says otherwise. It works like other inputs: it has a `value`, fires `input` and `change` when the user picks an option, supports `data-bind` and `data-trigger`, and sends its value with a form when it has a `name`. Arrow keys move between options, and `label` names the group for screen readers.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-switch label="Size" options="small|medium|large" value="medium"></webui-switch>

        <webui-switch theme="success" options="segment|h1|h2|h3|line break"></webui-switch>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column gap="var(--padding)" align="center">
            <webui-switch label="Size" options="small|medium|large" value="medium"></webui-switch>
            <webui-switch theme="success" options="segment|h1|h2|h3|line break"></webui-switch>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/switch.js" language="javascript" label="switch.js"></webui-code>
