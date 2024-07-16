
<webui-table theme="tertiary" columns="Id:;:Test One:|one;: Test Two ;Custom;Action" data-subscribe="page-report" data-set="setData" bordered class="my-3">
    <div slot="column" name="action">
        <webui-condition data-subscribe="page-tr-{_ROWID}.custom">
            <pre><webui-button theme="danger" data-trigger="page-tr-{_ROWID}.custom" data-value="" start-icon="ban" start-icon-family="duotone"></webui-button></pre>
        </webui-condition>
        <webui-condition data-subscribe="page-tr-{_ROWID}.custom" data-unequals="music" data-ignore-case>
            <pre><webui-button theme="warning" data-trigger="page-tr-{_ROWID}.custom" data-value="Music" start-icon="music" start-icon-family="duotone"></webui-button></pre>
        </webui-condition>
        <webui-condition data-subscribe="page-tr-{_ROWID}.custom" data-equals="Music">
            <pre><webui-button theme="primary" data-trigger="page-tr-{_ROWID}.custom" data-value="--Music--" start-icon="music" start-icon-family="duotone"></webui-button></pre>
        </webui-condition>
        <webui-condition data-subscribe="page-tr-{_ROWID}.custom" data-contains="music">
            <pre><webui-button theme="success" data-trigger="page-tr-{_ROWID}.custom" data-value="Music" start-icon="music" start-icon-family="duotone"></webui-button></pre>
        </webui-condition>
    </div>
    <div slot="column" name="custom">
        <webui-input-text theme="info" placeholder="Type music" data-trigger="page-tr-{_ROWID}.custom" data-subscribe="page-tr-{_ROWID}.custom"></webui-inpu-text>
    </div>
</webui-table>
<webui-data data-page-report='[{"id":1,"one":"Hello","TestTwo":"World"},{"id":2,"one":"Goodbye","TestTwo":"Moonmen"}]'></webui-data>
