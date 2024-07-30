
<webui-restrict-to-role role="1">
    <template slot="valid">
        <webui-quote theme="success">
            You are currently signed in!
        </webui-quote>
    </template>
    <template slot="invalid">
        <webui-quote theme="warning">
            When you are signed in this content will change to something else.
        </webui-quote>
    </template>
</webui-restrict-to-role>

<webui-condition data-subscribe="page-loaded">
    <template><webui-flex column>Page is loaded</webui-flex></template>
    <template slot="invalid"><webui-loading-bar indeterminate theme="info" height="5"></webui-loading-bar></template>
</webui-condition>

<webui-flex gap="10" class="mt-2">
    <webui-input-text label="Test Input is Valid" data-trigger="condition-check"></webui-input-text>
    <webui-condition data-subscribe="condition-check:setValue" debug>
        <template slot="valid">{TEMPLATE_CONDITION_CHECK} is Valid!</template>
        <template slot="invalid">{TEMPLATE_CONDITION_CHECK} is not Valid!</template>
    </webui-condition>
</webui-flex>
