<webui-page-segment elevation="10">
    The `<webui-page-requires>` component restricts access to a page based on global application state. By defining a `data-subscribe` attribute, you can specify required data keys (e.g., an active user session or authentication token). If the subscribed data evaluates to a falsy value (e.g., `0`, `null`, `undefined`, `''`), the component automatically redirects the user to the home page (`/`).
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <!-- Redirects to '/' if 'session-user-role' is not set or evaluates to false/0 -->
        <webui-page-requires data-subscribe="session-user-role"></webui-page-requires>
    ```
    <webui-page-segment elevation="10">
        <webui-alert show variant="info">This component operates invisibly in the DOM to enforce routing logic and has no visual output.</webui-alert>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/page-requires.js" language="javascript" label="page-requires.js"></webui-code>
