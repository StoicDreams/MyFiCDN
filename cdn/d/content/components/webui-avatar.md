<webui-page-segment elevation="10">
    The `<webui-avatar>` component displays a graphical representation of a user or entity. It dynamically renders an image, a `<webui-icon>`, or raw SVG content depending on the format of the value provided to the `src` attribute. If the `src` lacks a forward slash, it defaults to rendering a `webui-icon`.

    An image's `alt` attribute describes it for screen readers, such as `alt="Erik Gassler"` when the name isn't beside it. Without one, the picture is treated as decoration.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <!-- Icon rendering -->
        <webui-avatar src="circle_person|fill" theme="primary"></webui-avatar>

        <!-- Image URL rendering -->
        <webui-avatar src="https://cdn.myfi.ws/img/eg/me_64.png" alt="Erik Gassler"></webui-avatar>
    ```
    <webui-page-segment elevation="10">
        <webui-avatar src="circle_person|fill" theme="primary"></webui-avatar>
        <webui-avatar src="https://cdn.myfi.ws/img/eg/me_64.png" alt="Erik Gassler"></webui-avatar>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/avatar.js" language="javascript" label="avatar.js"></webui-code>
