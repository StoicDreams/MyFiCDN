<webui-page-segment elevation="10">
    The `<webui-dialog-action>` component defines a modal dialog template that triggers via a data subscription. It features native API integration, allowing the confirmation button to automatically execute an HTTP request (GET, POST, PUT, DELETE, PATCH) based on the `api` attribute. It handles the API response, surfaces success or failure alerts, and updates specified global state variables upon completion.
</webui-page-segment>

### Attributes

- **`api`:** the method and address the confirm button sends the dialog's fields to, such as `delete|/api/records/{id}`. The method is `post` when left out.
- **`title`** and **`confirm`:** the dialog's title and the text of its confirm button.
- **`content-type`:** how the fields are sent: `application/json` (the default), or `multipart/form-data` for a form with files.
- **`data-success`:** the data key that gets the answer of a request that succeeded.
- **`json-success`:** reads the answer as JSON, stores it parsed, and shows that field of it (or its `message`) as the success alert.
- **`header-message`:** response headers, separated by `|`, whose value is shown as the message, on success or failure, in place of the answer.
- **`data-exception`:** the data key that gets the error of a request that failed. The dialog stays open and shows it too.


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

### Choosing how it sends and what it reports

<webui-side-by-side>
    ```html:Code Snippet
        <webui-button data-trigger="demo-dialog-action" data-value="1">Save Settings</webui-button>
        <webui-dialog-action title="Save Settings" confirm="Save" api="put|/api/settings" content-type="application/json" json-success="message" header-message="x-message" data-success="demo-dialog-saved" data-exception="demo-dialog-error" data-subscribe="demo-dialog-action">
            <template>
                <webui-input-text label="Display Name" name="displayName"></webui-input-text>
            </template>
        </webui-dialog-action>
    ```
    <webui-page-segment elevation="10">
        <webui-button data-trigger="demo-dialog-action" data-value="1">Save Settings</webui-button>
        <webui-dialog-action title="Save Settings" confirm="Save" api="put|/api/settings" content-type="application/json" json-success="message" header-message="x-message" data-success="demo-dialog-saved" data-exception="demo-dialog-error" data-subscribe="demo-dialog-action">
            <template>
                <webui-input-text label="Display Name" name="displayName"></webui-input-text>
            </template>
        </webui-dialog-action>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/dialog-action.js" language="javascript" label="dialog-action.js"></webui-code>
