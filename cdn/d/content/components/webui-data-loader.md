<webui-page-segment elevation="10">
    The `<webui-data-loader>` component is designed to fetch external data from APIs or URLs and inject the responses directly into the application's data state. It supports automatic JSON parsing, request authorization, configurable load delays, and automatic retry logic for missing authentication or API root definitions.
</webui-page-segment>

## Data Loader Configurations

<webui-side-by-side>
    ```html:Code Snippet
        <!-- Basic Data Load -->
        <webui-data-loader src="/mock-data.json" data-trigger="mock-report"></webui-data-loader>

        <!-- Advanced Load with Auth and Multiple Endpoints -->
        <webui-data-loader 
            apiroot="app-api" 
            auth="session-token" 
            delay="50"
            data-user-profile="/user/profile"
            data-app-settings="/config/settings">
        </webui-data-loader>
    ```
    <webui-page-segment elevation="10">
        *   **Basic Data Load**: Fetches `/mock-data.json` and assigns the parsed JSON to the `mock-report` data key.
        *   **Advanced Load**: Waits for `app-api` and `session-token` to be populated in the data state. Preprends the API root to the endpoint paths and fetches `/user/profile` (assigning to `user-profile`) and `/config/settings` (assigning to `app-settings`), attaching the authorization header to the requests.
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/data-loader.js" language="javascript" label="data-loader.js"></webui-code>
