
<webui-flex>
    <webui-input-text label="New Tab Name" placeholder="Enter a name for a new tab" data-trigger="page-new-tab-input" maxlength="10"></webui-input-text>
    <webui-button theme="action" data-subscribe="page-new-tab-input:value" data-trigger="page-new-tab-input-create:value">Add Tab</webui-button>
</webui-flex>
<webui-tabs theme="secondary" index="1" transition-timing="200" data-subsribe="page-dynamic-tabs:setData">
    <template slot="template">
        <webui-button start-icon="trash-can" theme="danger"></webui-button>
    </template>
</webui-tabs>
