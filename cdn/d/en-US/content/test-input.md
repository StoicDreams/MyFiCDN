
<webui-side-by-side>
    <webui-flex column>
        <webui-input-text label="Data Trigger From webui-input-text" data-trigger="test1" data-subscribe="test1:value"></webui-input-text>
        <webui-flex>
            <label for="test2" class="nowrap">Data Trigger From input</label>
            <input id="test2" type="text" data-trigger="test1" data-subscribe="test1:value">
        </webui-flex>
    </webui-flex>
    <webui-flex column>
        <webui-flex>
            <span>Subscribe InnerHTML:</span>
            <span data-subscribe="test1:innerHTML"></span>
        </webui-flex>
        <webui-flex gap="5">
            <label class="nowrap">Subscribe value (readonly):</label>
            <input type="text" readonly data-subscribe="test1:value" />
        </webui-flex>
        <webui-input-message label="Message Box" data-trigger="test1" data-subscribe="test1"></webui-input-message>
    </webui-flex>
</webui-side-by-side>
