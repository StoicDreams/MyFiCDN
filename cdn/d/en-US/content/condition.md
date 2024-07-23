
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


