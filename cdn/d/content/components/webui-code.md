<webui-page-segment elevation="10">
    The `<webui-code>` component displays formatted code snippets with automatic syntax highlighting. It supports various programming languages, features an integrated copy-to-clipboard button, allows custom labels, and can load code directly from external source files using the `src` attribute.
</webui-page-segment>

### Attributes

- **`lang`** (or **`language`**): the language to highlight, such as `javascript`, `html`, `css`, `rust`, or `json`.
- **`label`:** a name shown above the code, such as its file name.
- **`src`:** the address of a file to load and show.
- **`lines`:** how many lines show, scrolling for the rest.
- **`nocopy`:** hides the copy icon. Without a `label` too, the row above the code is hidden.

<webui-side-by-side>
    ```html:Code Snippet
        <!-- Basic Code Block -->
        <webui-code lang="javascript" label="example.js">
            function sayHello() {
                console.log("Hello, Web UI!");
            }
        </webui-code>

        <!-- Block Without Copy Button -->
        <webui-code lang="css" label="styles.css" nocopy>
            body {
                background-color: var(--color-background);
            }
        </webui-code>

        <!-- Loading from an External Source -->
        <webui-code src="https://cdn.myfi.ws/webui/version" lang="text" label="Version File"></webui-code>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column>
            <webui-code lang="javascript" label="example.js">
                function sayHello() {
                    console.log("Hello, Web UI!");
                }
            </webui-code>
            <webui-code lang="css" label="styles.css" nocopy>
                body {
                    background-color: var(--color-background);
                }
            </webui-code>
            <webui-code src="https://cdn.myfi.ws/webui/version" lang="text" label="Version File"></webui-code>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Plain text

Set `lang="text"` (or `language="text"`) for prose, such as a prompt or a message to copy, so nothing in it is highlighted. Without a known language, the default rules color quoted text, numbers, and comments, which can catch apostrophes and `#` in ordinary writing.

### Set lines, without copying

<webui-side-by-side>
    ```html:Code Snippet
        <webui-code lang="rust" lines="3" nocopy>
            fn main() {
                let names = ["Web", "UI"];
                for name in names {
                    println!("Hello, {name}!");
                }
            }
        </webui-code>
    ```
    <webui-page-segment elevation="10">
        <webui-code lang="rust" lines="3" nocopy>
            fn main() {
                let names = ["Web", "UI"];
                for name in names {
                    println!("Hello, {name}!");
                }
            }
        </webui-code>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/code.js" language="javascript" label="code.js"></webui-code>
