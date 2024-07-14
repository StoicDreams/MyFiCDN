/* Display page not found content */
webui.define('webui-page-not-found', {
    connected: (t) => {
        if (!t.innerHTML) {
            t.innerHTML = webui.trimLinePreTabs(`
            <webui-data data-page-title="Page Not Found" data-page-subtitle="{PAGE_PATH}"></webui-data>
            <webui-data data-page-next-page='{"name":"Home","href":"/"}'></webui-data>
            <webui-side-by-side elevation="10">
                <webui-flex column justify="center" data-subscribe="not-found" data-set="innerHTML">
                    <p>The page you are looking for was not found!</p>
                </webui-flex>
                <webui-flex column justify="center">
                    <img src="https://cdn.myfi.ws/v/Vecteezy/404-error-illustration-exclusive-design-inspiration.svg" />
                </webui-flex>
            </webui-side-by-side>
            `);
        }
    }
});
