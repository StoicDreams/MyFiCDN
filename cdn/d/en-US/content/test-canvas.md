> Test displaying html through a canvas.
<webui-side-by-side>
    <webui-flex column>
        <webui-input-message height="300" label="Enter HTML here" data-trigger="session-test-html" data-subscribe="session-test-html:value"></webui-input-text>
    </webui-flex>
    <webui-canvas theme="secondary" line-numbers height="300" alt-color="--color-info" data-subscribe="session-test-html:setFromText|session-canvas-scroll:setScroll" data-trigger="session-canvas-scroll:getScroll"></webui-canvas>
    <webui-canvas theme="white" height="300" data-subscribe="session-test-html:setFromText|session-canvas-scroll:setScroll" data-trigger="session-canvas-scroll:getScroll"></webui-canvas>
    <webui-canvas theme="black" height="300" data-subscribe="session-test-html:setFromText|session-canvas-scroll:setScroll" data-trigger="session-canvas-scroll:getScroll"></webui-canvas>
</webui-side-by-side>
