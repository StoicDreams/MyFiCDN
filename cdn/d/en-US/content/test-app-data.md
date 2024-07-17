> Persists until page reloaded or closed
<webui-side-by-side>
    <webui-flex column>
        <webui-input-text label="App Struct Test - subscribed to test.name" compact theme="danger" placeholder="Data entered here will persist through page navigations." data-trigger="test.name" data-subscribe="test.name" data-set="value"></webui-input-text>
        <webui-input-text theme="info" label="App Test.One" placeholder="One" data-trigger="test.one" data-subscribe="test.one" data-set="value"></webui-input-text>
        <webui-input-text theme="tertiary" label="App Test.Two" placeholder="Two" data-trigger="test.two" data-subscribe="test.two" data-set="value"></webui-input-text>
        <webui-input-text theme="secondary" label="App Test.Three" placeholder="Three" data-trigger="test.three" data-subscribe="test.three" data-set="value"></webui-input-text>
        <webui-dropdown theme="primary" data-name="page-test-selected" icon="flask-vial" label="Dropdown Test" newlabel="Select an Option!" data-trigger="test.dropdown" data-subscribe="test.dropdown" data-options="page-dropdown-test">
            <option slot="template">{TEMPLATE_NAME}</option>
        </webui-dropdown>
    </webui-flex>
    <webui-paper>
        <webui-code label="test" lang="json" data-subscribe="test"></webui-code>
        <webui-code theme="tertiary" label="page-test-selected" lang="json" data-subscribe="page-test-selected"></webui-code>
        <webui-code theme="primary" label="page-test-selected.name" lang="json" data-subscribe="page-test-selected.name"></webui-code>
    </webui-paper>
</webui-side-by-side>