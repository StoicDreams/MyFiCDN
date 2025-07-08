
## Mock Report

<webui-page-segment>
<webui-input-range label="Record Count" min="5" max="105" step="5" value="5" data-subscribe="mock-report-filter.recordCount:setValue" data-trigger="mock-report-filter.recordCount"></webui-input-range>
</webui-page-segment>

<webui-report label="Results" api="/mock/report" filters="mock-report-filter" sort-column="name" bordered theme="info" sortable="Id,Name,Note">
<template slot="column" name="action">
    <webui-button theme="danger"></webui-button>
</template>
</webui-report>
