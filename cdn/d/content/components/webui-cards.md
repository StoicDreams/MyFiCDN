<webui-page-segment elevation="10">
    The `<webui-cards>` component is a responsive grid container designed to display a collection of `<webui-card>` elements. It supports defining cards directly via HTML or loading them dynamically from a JSON endpoint using the `src` attribute. `card-width` sets the widest each card grows, in pixels, and the grid fits as many in a row as there is room for.
</webui-page-segment>

### Attributes

- **`card-width`:** the widest a card grows, in pixels. Each card is given it as its `width`.
- **`src`:** the address of a JSON array of cards to show, each with any of `name`, `avatar`, `link`, `theme`, `width`, `elevation`, `class`, and `body` (the card's content, as markup).
- **`theme`:** given to the cards loaded from `src` that set none of their own. Like `elevation`, it also styles the grid itself, as it does any element.

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

### From a file, with a theme

<webui-side-by-side>
    ```html:Code Snippet
        <webui-cards card-width="200" theme="info" elevation="2" src="https://cdn.myfi.ws/current-projects.json"></webui-cards>
    ```
    <webui-cards card-width="200" theme="info" elevation="2" src="https://cdn.myfi.ws/current-projects.json"></webui-cards>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/cards.js" language="javascript" label="cards.js"></webui-code>
