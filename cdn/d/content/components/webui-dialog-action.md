<webui-page-segment elevation="10">
    The `<webui-dialog-action>` component defines a modal dialog template that triggers via a data subscription. It features native API integration, allowing the confirmation button to automatically execute an HTTP request (GET, POST, PUT, DELETE, PATCH) based on the `api` attribute. It handles the API response, surfaces success or failure alerts, and updates specified global state variables upon completion.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <!-- Trigger Button -->
        <webui-button theme="danger" data-trigger="delete-record-trigger" data-value="123">Delete Record</webui-button>

        <!-- Dialog Action Definition -->
        <webui-dialog-action title="Confirm Deletion" confirm="Delete" api="delete|/api/records/{id}" data-subscribe="delete-record-trigger" data-success="record-deleted-event">
            <template>
                <p>Are you sure you want to delete this record?</p>
                <webui-input-text label="Record ID" data-param-name="id" data-param-in="path" value="{TEMPLATE_ROWDATA}" readonly></webui-input-text>
            </template>
        </webui-dialog-action>
    ```
    <webui-page-segment elevation="10">
        *   **Data Subscription Trigger**: The `<webui-dialog-action>` listens to the `delete-record-trigger` data key. When a `<webui-button>` triggers this key with a value, the dialog opens and populates its template.
        *   **API Integration**: The `api` attribute specifies the HTTP method and endpoint (e.g., `delete|/api/records/{id}`). Inputs with `data-param-name` and `data-param-in` automatically map their values into the request path, query, or headers.
        *   **State Updates**: On a successful API response, the payload or success message is written to the `record-deleted-event` data key specified by the `data-success` attribute.
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/dialog-action.js" language="javascript" label="dialog-action.js"></webui-code>
