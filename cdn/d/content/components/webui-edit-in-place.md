<webui-page-segment elevation="10">
    The `<webui-edit-in-place>` component shows text that is edited where it is shown, such as a name. Clicking the text, or its pencil, puts a field with Cancel and Save in its place, with the text chosen so typing replaces it. Enter saves and Escape cancels. `value` is the text, `label` names the field for screen readers, `edit-title` is the button's tooltip, and `placeholder` shows in an empty field. With `required`, blank text is refused, and the attribute's value is the message shown.

    Saving sends a `save` event with `value` and `previous` in its `detail`. Call `preventDefault()` to refuse it, or pass a promise to `detail.waitUntil()` that resolves to false to refuse it later, such as when a server says no. A refused save keeps the field open with what was typed. Once saved, `value` is the new text and a `change` event says so. Saving the same text, or cancelling, closes the field without a `save`, and Cancel sends a `cancel` event. While the field is open the component has the `editing` attribute, and while a save waits, `saving`. Style its parts from the page with `::part(text)`, `value`, `icon`, `editor`, `field`, `cancel`, and `save`.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-edit-in-place value="My project" label="Project name" edit-title="Rename the project" required="Project name cannot be empty."></webui-edit-in-place>
    ```
    <webui-page-segment elevation="10">
        <webui-edit-in-place value="My project" label="Project name" edit-title="Rename the project" required="Project name cannot be empty."></webui-edit-in-place>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/edit-in-place.js" language="javascript" label="edit-in-place.js"></webui-code>
