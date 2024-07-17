> Clears when navigating to new page
<webui-side-by-side>
    <section>
        <webui-input-text label="Page Struct Test - subscribed to page-test.name" compact theme="success"   placeholder="Data entered here will be removed when page is changed" data-trigger="page-test.name" data-subscribe="page-test.name:value"></webui-input-text>
    </section>
    <section>
        <webui-code lang="json" data-subscribe="page-test"></webui-code>
    </section>
</webui-side-by-side>