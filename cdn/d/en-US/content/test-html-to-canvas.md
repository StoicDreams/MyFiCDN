> Test displaying html through a canvas.
<webui-side-by-side>
    <webui-flex column>
        <webui-input-message max-height="500" label="Enter HTML here" data-trigger="session-test-html" data-subscribe="session-test-html:value"></webui-input-text>
    </webui-flex>
    <webui-canvas line-numbers max-height="500" alt-color="#DDF" data-subscribe="session-test-html:setFromText"></webui-canvas>
</webui-side-by-side>
