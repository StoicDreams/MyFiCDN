<webui-page-segment elevation="10">
    The `<webui-button>` component provides an interactive button element that can act as a standard click target, a form submission trigger, or a navigational link. It features built-in data manipulation capabilities, allowing it to transfer data, clear global data keys, or remove specific items from stored arrays or objects directly via HTML attributes. It also supports `start-icon` and `end-icon` integrations.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <!-- Standard Button -->
        <webui-button theme="primary">Primary Button</webui-button>

        <!-- Button with Icons -->
        <webui-button theme="success" start-icon="arrow|rotate:180" end-icon="arrow">With Icons</webui-button>

        <!-- Navigational Link Button -->
        <webui-button theme="info" href="/about">Go to About</webui-button>

        <!-- Data Manipulation (Clear Data) -->
        <webui-button theme="danger" data-clear="session-temp-data">Clear Data</webui-button>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column>
            <webui-button theme="primary">Primary Button</webui-button>
            <webui-button theme="success" start-icon="check" end-icon="arrow-right">With Icons</webui-button>
            <webui-button theme="info" href="/about">Go to About</webui-button>
            <webui-button theme="danger" data-clear="session-temp-data">Clear Data</webui-button>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/button.js" language="javascript" label="button.js"></webui-code>
