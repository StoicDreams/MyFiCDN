<webui-page-segment elevation="10">
    The `<webui-toggle-icon>` component renders an interactive button that switches between an "on" and "off" state. It supports swapping icons, UI themes, and accessibility titles depending on its current state. It can operate independently or mirror the state of another component using the `data-enabled` attribute.
</webui-page-segment>

### Attributes

- **`label`:** text beside the icon.
- **`icon`**, or **`icon-on`** and **`icon-off`:** the icon, or a different one for each state. Flags after `|` apply only in that state.
- **`flags-on`** and **`flags-off`:** icon flags, separated by spaces, for each state, such as `fill`.
- **`theme-on`** and **`theme-off`:** the colors for each state.
- **`title`**, or **`title-on`** and **`title-off`:** the button's name for screen readers, shown as its tooltip. When the two differ, they say what pressing does, such as "Hide" and "Show". Otherwise screen readers also hear whether it is on.
- **`enabled`:** starts it on. It is set while on and removed while off, so CSS and tests can read it.
- **`data-enabled`:** a selector of a drawer whose docked state it follows, as a drawer's Dock button does.

Two-state choices, such as on and off, use this component rather than a button that switches its text.


<webui-side-by-side>
    ```html:Code Snippet
        <webui-toggle-icon
            label="Feature Toggle"
            icon-on="toggle-on|fill"
            icon-off="toggle-off"
            theme-on="success"
            theme-off="danger"
            title-on="Disable Feature"
            title-off="Enable Feature">
        </webui-toggle-icon>
    ```
    <webui-page-segment elevation="10">
        <webui-flex justify="center" align="center">
            <webui-toggle-icon label="Feature Toggle" icon-on="toggle-on|fill" icon-off="toggle-off" theme-on="success" theme-off="danger" title-on="Disable Feature" title-off="Enable Feature"></webui-toggle-icon>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Styling

Set `--toggle-icon-padding` to change the space around the button, for example `style="--toggle-icon-padding:0;"` for an icon with no padding. The button's colors come from `theme-on` and `theme-off`.

### Starting on, filled while on

<webui-side-by-side>
    ```html:Code Snippet
        <webui-toggle-icon title="Bold" icon="bold" flags-on="fill" flags-off="" theme-on="primary" enabled></webui-toggle-icon>
    ```
    <webui-page-segment elevation="10">
        <webui-toggle-icon title="Bold" icon="bold" flags-on="fill" flags-off="" theme-on="primary" enabled></webui-toggle-icon>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/toggle-icon.js" language="javascript" label="toggle-icon.js"></webui-code>
