<webui-page-segment elevation="10">
    The `<webui-input-text>` component provides a flexible, single-line text input field supporting multiple types (such as text, number, and password). It includes built-in value sanitization, min/max length validation, autofocus handling, and seamless integration with global data triggers.
</webui-page-segment>

### Attributes

- **`value`** and **`placeholder`:** the text, and the hint shown while it is empty.
- **`type`:** the kind of field, such as `text` (the default), `number`, `email`, `password`, or `date`.
- **`minlength`** and **`maxlength`:** the shortest and longest the text can be.
- **`min`** and **`max`:** the lowest and highest number a `number` field takes. A number past them is brought back within them.
- **`readonly`:** shows the value but keeps it from being changed.
- **`label`:** the field's name, shown beside it. Without one, its `aria-label`, `title`, or `placeholder` names it for screen readers.
- **`name`:** the name the value is sent under in a form.
- **`id`:** moves to the field itself, so a `<label for>` elsewhere on the page names it.
- **`autofocus`:** puts the cursor in the field when the page opens.
- **`compact`:** puts a smaller label above the field.
- **`disabled`:** turns the field off, as does a disabled `<fieldset>` around it.

Typed text is cleaned of markup, except in a `password` field.


<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex column gap="4">
            <!-- Standard Text Input -->
            <webui-input-text label="Username" placeholder="Enter username..." theme="primary"></webui-input-text>

            <!-- Number Input with Min/Max -->
            <webui-input-text type="number" label="Age" min="1" max="120" value="25" theme="secondary"></webui-input-text>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column gap="4">
            <webui-input-text label="Username" placeholder="Enter username..." theme="primary"></webui-input-text>
            <webui-input-text type="number" label="Age" min="1" max="120" value="25" theme="secondary"></webui-input-text>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Lengths, a name without a label, and read only

<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex column gap="4">
            <webui-input-text label="Code" name="code" minlength="4" maxlength="8" placeholder="4 to 8 characters" compact></webui-input-text>
            <webui-input-text title="Search the docs" type="search" placeholder="Search"></webui-input-text>
            <webui-input-text label="Account" value="AC-1234" readonly></webui-input-text>
            <webui-input-text label="Turned off" disabled></webui-input-text>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column gap="4">
            <webui-input-text label="Code" name="code" minlength="4" maxlength="8" placeholder="4 to 8 characters" compact></webui-input-text>
            <webui-input-text title="Search the docs" type="search" placeholder="Search"></webui-input-text>
            <webui-input-text label="Account" value="AC-1234" readonly></webui-input-text>
            <webui-input-text label="Turned off" disabled></webui-input-text>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/input-text.js" language="javascript" label="input-text.js"></webui-code>
