<webui-page-segment elevation="10">
    The `<webui-cards>` component is a responsive grid container designed to display a collection of `<webui-card>` elements. It supports defining cards directly via HTML or loading them dynamically from a JSON endpoint using the `src` attribute. It applies consistent styling across all nested cards using attributes like `card-width`, `elevation`, and `theme`.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-cards card-width="220">
            <webui-card>
                Example Card
            </webui-card>
            <webui-card name="Example">
                Example Card
            </webui-card>
            <webui-card avatar="star|fill">
                Example Card
            </webui-card>
            <webui-card name="Example" avatar="star|fill">
                Example Card
            </webui-card>
            <webui-card name="Example" avatar="star|fill" link="/">
                Example Card
            </webui-card>
            ...
        </webui-cards>
    ```
    <webui-cards card-width="300">
        <webui-card>
            Example Card
        </webui-card>
        <webui-card name="Example">
            Example Card
        </webui-card>
        <webui-card avatar="star|fill">
            Example Card
        </webui-card>
        <webui-card name="Example" avatar="star|fill">
            Example Card
        </webui-card>
        <webui-card name="Example" avatar="star|fill" link="/">
            Example Card
        </webui-card>
        <webui-card>
            Example Card
        </webui-card>
        <webui-card>
            Example Card
        </webui-card>
        <webui-card>
            Example Card
        </webui-card>
        <webui-card>
            Example Card
        </webui-card>
        <webui-card>
            Example Card
        </webui-card>
    </webui-cards>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/cards.js" language="javascript" label="cards.js"></webui-code>
