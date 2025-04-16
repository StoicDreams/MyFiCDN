> Persists based on user session settings.
<webui-side-by-side>
    <webui-flex column>
        <webui-input-text label="Session Struct Test - subscribed to session-test.name" compact theme="danger" placeholder="Data entered here will persist through page navigations." data-trigger="session-test.name" data-subscribe="session-test.name:value"></webui-input-text>
        <webui-input-text theme="info" label="Session Test.One" placeholder="One" data-trigger="session-test.one" data-subscribe="session-test.one:value"></webui-input-text>
        <webui-input-text theme="tertiary" label="Session Test.Two" placeholder="Two" data-trigger="session-test.two" data-subscribe="session-test.two:value"></webui-input-text>
        <webui-input-text theme="secondary" label="Session Test.Three" placeholder="Three" data-trigger="session-test.three" data-subscribe="session-test.three:value"></webui-input-text>
        <webui-dropdown theme="primary" data-name="session-test-selected" icon="flask-vial" label="Dropdown Test" newlabel="Select an Option!" data-trigger="session-test.dropdown" data-subscribe="session-test.dropdown" data-options="page-dropdown-test">
            <option slot="template">{TEMPLATE_NAME}</option>
        </webui-dropdown>
    </webui-flex>
    <webui-paper>
        <webui-code label="session-test" lang="json" data-subscribe="session-test"></webui-code>
        <webui-code theme="tertiary" label="test-selected" lang="json" data-subscribe="test-selected"></webui-code>
        <webui-code theme="primary" label="test-selected.name" lang="json" data-subscribe="test-selected.name"></webui-code>
    </webui-paper>
</webui-side-by-side>

<webui-myfi-storage-consent></webui-myfi-storage-consent>
