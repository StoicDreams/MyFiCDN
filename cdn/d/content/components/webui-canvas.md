<webui-page-segment elevation="10">
    The `<webui-canvas>` component renders text or HTML-extracted text directly onto an HTML5 `<canvas>` element. It is highly performant for displaying large blocks of text, logs, or code. It features built-in text wrapping, a custom scroll implementation, optional line numbers, and alternating background colors for improved readability.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-data data-subscribe="canvas-sample-text:setDefault">
            <template name="canvas-sample-text" slot="text">
                Line 1: Welcome to Web UI
                Line 2: This is a canvas component.
                Line 3: It handles text rendering natively.
                Line 4: And supports alternating colors!
                Line 5: As well as line numbers.
            </template>
        </webui-data>

        <!-- Standard Canvas -->
        <webui-canvas theme="white" height="150" data-subscribe="canvas-sample-text:setFromText"></webui-canvas>
        
        <!-- Canvas with Line Numbers and Alternating Colors -->
        <webui-canvas theme="secondary" line-numbers height="150" alt-color="--color-info" data-subscribe="canvas-sample-text:setFromText"></webui-canvas>
    ```
    <webui-page-segment elevation="10">
        <webui-data data-subscribe="canvas-sample-text:setDefault">
            <template name="canvas-sample-text" slot="text">
                Line 1: Welcome to Web UI
                Line 2: This is a canvas component.
                Line 3: It handles text rendering natively.
                Line 4: And supports alternating colors!
                Line 5: As well as line numbers.
            </template>
        </webui-data>
        <webui-flex column>
            <webui-canvas theme="white" height="150" data-subscribe="canvas-sample-text:setFromText"></webui-canvas>
            <webui-canvas theme="secondary" line-numbers height="150" alt-color="--color-info" data-subscribe="canvas-sample-text:setFromText"></webui-canvas>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/canvas.js" language="javascript" label="canvas.js"></webui-code>
