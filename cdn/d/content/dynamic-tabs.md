
<webui-data data-subscribe="session-dynamic-tabs:setDefault">
    <template slot="json" name="session-dynamic-tabs">[]</template>
</webui-data>
<webui-data data-subscribe="page-new-tab-input-create:pushItem">
    <template slot="json" name="page-new-tab-input-create" data-update="session-dynamic-tabs">{}</template>
</webui-data>
<webui-flex>
    <webui-input-text label="New Tab Name" placeholder="Enter a name for a new tab" data-trigger="page-new-tab-input.name" data-subscribe="page-new-tab-input.name" maxlength="10"></webui-input-text>
    <webui-button theme="action" data-transfer="page-new-tab-input:page-new-tab-input-create" data-clear="page-new-tab-input">Add Tab</webui-button>
</webui-flex>
<webui-tabs theme="secondary" index="1" transition-timing="200" data-subscribe="session-dynamic-tabs:setData">
    <template slot="template" name="label">
        {TEMPLATE_NAME}
    </template>
    <template slot="template" name="content">
        This is tab page {TAB_PAGE}.
        <webui-button class="p-abs" top="5" right="5" start-icon="trash-can" theme="danger" data-remove-item="session-dynamic-tabs:{TAB_INDEX}"></webui-button>
    </template>
</webui-tabs>
