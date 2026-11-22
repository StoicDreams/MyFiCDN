<webui-page-segment elevation="10">
    The `<webui-input-range>` component renders a responsive slider input field with a real-time numeric value display. It supports standard slider configuration attributes like `min`, `max`, `step`, and `value`, and can use custom rendering functions via `onrender` to format the displayed value.
</webui-page-segment>

### Attributes

- **`value`**, **`min`**, **`max`**, and **`step`:** the slider's value and range.
- **`onrender`:** the name of a function that turns the value into the text shown beside the slider.
- **`readonly`:** shows the value, with the slider turned off.
- **`label`:** the field's name, shown beside it. Without one, its `aria-label`, `title`, or `placeholder` names it for screen readers.
- **`name`:** the name the value is sent under in a form.
- **`id`:** moves to the field itself, so a `<label for>` elsewhere on the page names it.
- **`autofocus`:** puts the cursor in the field when the page opens.
- **`compact`:** puts a smaller label above the field.
- **`disabled`:** turns the field off, as does a disabled `<fieldset>` around it.


<webui-side-by-side>
    ```html:Code Snippet
        <webui-input-range
            label="Volume Control"
            min="0"
            max="100"
            step="5"
            value="50"
            theme="primary">
        </webui-input-range>
    ```
    <webui-page-segment elevation="10">
        <webui-input-range
            label="Volume Control"
            min="0"
            max="100"
            step="5"
            value="50"
            theme="primary">
        </webui-input-range>
    </webui-page-segment>
</webui-side-by-side>

### Named by its title, and read only

<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex column gap="4">
            <webui-input-range title="Zoom" name="zoom" min="50" max="200" step="10" value="100" compact></webui-input-range>
            <webui-input-range label="Locked" value="3" max="10" readonly></webui-input-range>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column gap="4">
            <webui-input-range title="Zoom" name="zoom" min="50" max="200" step="10" value="100" compact></webui-input-range>
            <webui-input-range label="Locked" value="3" max="10" readonly></webui-input-range>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/input-range.js" language="javascript" label="input-range.js"></webui-code>
