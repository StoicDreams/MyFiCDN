> Test displaying html through a canvas.
<webui-side-by-side>
    <webui-flex column>
        <webui-input-message label="Enter HTML here" data-trigger="session-test-html" data-subscribe="session-test-html:value"></webui-input-text>
    </webui-flex>
    <webui-html-to-canvas max-height="300" data-subscribe="session-test-html:setHTML"></webui-html-to-canvas>
</webui-side-by-side>
