> Persists until page reloaded or closed
<webui-side-by-side>
    <webui-flex column>
        <webui-input-text label="App Struct Test - subscribed to app-test.name" compact theme="danger" placeholder="Data entered here will persist through page navigations." data-trigger="app-test.name" data-subscribe="app-test.name:value"></webui-input-text>
        <webui-input-text theme="info" label="App Test.One" placeholder="One" data-trigger="app-test.one" data-subscribe="app-test.one:value"></webui-input-text>
        <webui-input-text theme="tertiary" label="App Test.Two" placeholder="Two" data-trigger="app-test.two" data-subscribe="app-test.two:value"></webui-input-text>
        <webui-input-text theme="secondary" label="App Test.Three" placeholder="Three" data-trigger="app-test.three" data-subscribe="app-test.three:value"></webui-input-text>
        <webui-dropdown theme="primary" data-name="app-test-selected" icon="flask-vial" label="Dropdown Test" newlabel="Select an Option!" data-trigger="app-test.dropdown" data-subscribe="app-test.dropdown" data-options="page-dropdown-test">
            <option slot="template">{TEMPLATE_NAME}</option>
        </webui-dropdown>
    </webui-flex>
    <webui-paper>
        <webui-code label="app-test" lang="json" data-subscribe="app-test"></webui-code>
        <webui-code theme="tertiary" label="test-selected" lang="json" data-subscribe="test-selected"></webui-code>
        <webui-code theme="primary" label="test-selected.name" lang="json" data-subscribe="test-selected.name"></webui-code>
    </webui-paper>
</webui-side-by-side>
