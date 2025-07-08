<webui-grid  theme="info" columns="auto max-content">
    <h3>Year: <strong class="ml-1" data-subscribe="page-mock-report-current.year:text"></strong></h3>
    <webui-pagination class="my-a" data-subscribe="mock-data-index:setValue|mock-report:setData" data-current="page-mock-report-current" loop max-pages="3"></webui-pagination>
</webui-grid>
<webui-table theme="tertiary" columns="Id|_rowId;:Name|name;:Usage Percentage:|usage_percentage;Custom;:Action:" data-subscribe="page-mock-report-current.languages:setData" sortable="_rowId;name;usage_percentage" bordered class="my-3" current-sort="usage_percentage" current-sort-dir="desc">
    <template slot="column" name="action">
        <webui-condition data-subscribe="page-tr-{_ROWID}.custom">
            <template><webui-button theme="danger" data-trigger="page-tr-{_ROWID}.custom" data-value="" start-icon="ban"></webui-button></template>
        </webui-condition>
        <webui-condition data-subscribe="page-tr-{_ROWID}.custom" data-unequals="music" data-ignore-case>
            <template><webui-button theme="warning" data-trigger="page-tr-{_ROWID}.custom" data-value="Music" start-icon="music"></webui-button></template>
        </webui-condition>
        <webui-condition data-subscribe="page-tr-{_ROWID}.custom" data-equals="Music">
            <template><webui-button theme="primary" data-trigger="page-tr-{_ROWID}.custom" data-value="--Music--" start-icon="music"></webui-button></template>
        </webui-condition>
        <webui-condition data-subscribe="page-tr-{_ROWID}.custom" data-contains="music">
            <template><webui-button theme="success" data-trigger="page-tr-{_ROWID}.custom" data-value="Music" start-icon="music"></webui-button></template>
        </webui-condition>
    </template>
    <template slot="column" name="custom">
        <webui-input-text theme="info" placeholder="Type music" data-trigger="page-tr-{_ROWID}.custom" data-subscribe="page-tr-{_ROWID}.custom:value"></webui-inpu-text>
    </template>
</webui-table>
