<webui-page-segment elevation="10">
    The `<webui-restrict-to-role>` component conditionally renders content based on the current user's role. It subscribes to the `session-user-role` state and performs a bitwise check against the required `role` attribute. If the user meets the requirement, it renders the `valid` slot; otherwise, it renders the `invalid` slot.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-restrict-to-role role="1">
            <template slot="valid">
                <webui-alert show variant="success">You have access to this feature!</webui-alert>
            </template>
            <template slot="invalid">
                <webui-alert show variant="danger">Access Denied: Insufficient Permissions.</webui-alert>
            </template>
        </webui-restrict-to-role>
    ```
    <webui-page-segment elevation="10">
        <webui-restrict-to-role role="1">
            <template slot="valid">
                <webui-alert show variant="success">You have access to this feature!</webui-alert>
            </template>
            <template slot="invalid">
                <webui-alert show variant="danger">Access Denied: Insufficient Permissions.</webui-alert>
            </template>
        </webui-restrict-to-role>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/restrict-to-role.js" language="javascript" label="restrict-to-role.js"></webui-code>
