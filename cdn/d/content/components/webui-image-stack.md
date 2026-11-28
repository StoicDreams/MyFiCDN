<webui-page-segment elevation="10">
    The `<webui-image-stack>` component stacks the `<img>` elements written inside it on top of one another, each one offset from the one above it, so a bit of every image shows. The first image starts on top. Clicking an image, or pressing Enter or Space on it, brings it to the top, and the rest keep their order below it. Use it for pictures that belong together, such as an app's separate windows.
    - **`offset-x`, `offset-y`:** how far each image sits from the one above it, in pixels. Both default to 24. Negative values stack up or to the left.
    - **`rotate`:** a flag that tilts every image below the top one. Each image keeps its own tilt: it is straight while on top, and turns back to the same tilt when it goes below again. Set `data-rotation` (degrees) on an image to choose its tilt, or leave it out for a random one. Every image gets a margin as wide as the furthest tilted corner reaches, so tilted images stay inside the stack and never cover the page around it.
    - **`max-rotation`:** the largest random tilt, in degrees. Defaults to 6.
    - **`transition`:** how long images take to move and turn, in milliseconds, easing in and out. Defaults to 500.
    The stack fires `change` when an image comes to the top, with the image as `event.detail.image`. In a `<webui-gallery>`, a stack is one item: its first image is the card, and the viewer shows the whole stack.
</webui-page-segment>

## Stacked Windows

<webui-side-by-side>
    ```html:Code Snippet
        <webui-image-stack rotate offset-x="40" offset-y="32">
            <img src="https://www.stoicdreams.com/img/screenshots/pages/root.png" alt="Stoic Dreams home page">
            <img src="https://www.taskstory.com/img/screenshots/story.png" alt="A published story in Task Story">
            <img src="https://www.taskstory.com/img/screenshots/dashboard.png" alt="The Task Story dashboard">
        </webui-image-stack>
    ```
    <webui-page-segment elevation="10">
        <webui-image-stack rotate offset-x="40" offset-y="32">
            <img src="https://www.stoicdreams.com/img/screenshots/pages/root.png" alt="Stoic Dreams home page">
            <img src="https://www.taskstory.com/img/screenshots/story.png" alt="A published story in Task Story">
            <img src="https://www.taskstory.com/img/screenshots/dashboard.png" alt="The Task Story dashboard">
        </webui-image-stack>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/image-stack.js" language="javascript" label="image-stack.js"></webui-code>
