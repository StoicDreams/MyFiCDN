
## Mock Report

<webui-page-segment>
<webui-input-range label="Record Count" min="5" max="105" step="5" value="5" data-subscribe="mock-report-filter.recordCount:setValue" data-trigger="mock-report-filter.recordCount"></webui-input-range>
</webui-page-segment>

<webui-report label="Results" api="/mock/report" filters="mock-report-filter" sort-column="name" bordered theme="info" sortable="Id,Name,Note" append-columns=":Action:">
<template slot="column" name="action">
    <webui-button theme="danger" start-icon="ban" data-value="{TEMPLATE_ROWDATA}" data-trigger="action-{_ROWID}" title="Call Dialog for {TEMPLATE_NAME}"></webui-button>
    <webui-dialog-action title="Action {TEMPLATE_NAME}" data-subscribe="action-{_ROWID}">
        <template>
            <webui-page-segment>
                This is an example dialog for {TEMPLATE_NAME}.
            </webui-page-segment>
            <webui-code label="Row Data">{TEMPLATE_ROWDATA}</webui-code>
        </template>
    </webui-dialog-action>
</template>
</webui-report>
