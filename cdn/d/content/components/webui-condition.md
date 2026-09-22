<webui-page-segment elevation="10">
    The `<webui-condition>` component conditionally renders content by evaluating its `value` or data bound via `data-subscribe`. It supports explicit condition rules including `data-equals`, `data-unequals`, `data-contains`, and `data-match`, along with an optional `data-ignore-case` modifier. If the condition is met, it renders the `valid` slot; otherwise, it renders the `invalid` slot.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <!-- Basic Truthy Check -->
        <webui-condition value="true">
            <template slot="valid">Condition is met!</template>
            <template slot="invalid">Condition failed.</template>
        </webui-condition>

        <!-- Equals Check with Ignore Case -->
        <webui-condition value="Admin" data-equals="admin" data-ignore-case>
            <template slot="valid">User is Admin</template>
            <template slot="invalid">Access Denied</template>
        </webui-condition>

        <!-- Contains Check -->
        <webui-condition value="Hello World" data-contains="World">
            <template slot="valid">Contains 'World'</template>
        </webui-condition>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column>
            <webui-condition value="true">
                <template slot="valid">Condition is met!</template>
                <template slot="invalid">Condition failed.</template>
            </webui-condition>
            <webui-condition value="Admin" data-equals="admin" data-ignore-case>
                <template slot="valid">User is Admin</template>
                <template slot="invalid">Access Denied</template>
            </webui-condition>
            <webui-condition value="Hello World" data-contains="World">
                <template slot="valid">Contains 'World'</template>
            </webui-condition>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/condition.js" language="javascript" label="condition.js"></webui-code>
