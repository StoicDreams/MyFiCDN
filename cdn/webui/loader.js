/* This script is used to dynamically load web components as webui-* components are encountered in the dom. */
{
    const wuiPrefix = `WEBUI-`;
    const wcLabel = `WebUI Web Component`;
    const wcLoaded = {};
    const wcLoading = {};
    const wcRoot = location.hostname === '127.0.0.1' ? '' : 'https://cdn.myfi.ws/';
    const wcMin = wcRoot === '' ? '' : '.min';
    console.groupCollapsed(`${wcLabel}s Loaded`);
    async function processNode(node) {
        if (wcLoading[node.nodeName]) return;
        wcLoading[node.nodeName] = true;
        let script = document.createElement('script');
        let wc = node.nodeName.split('-').splice(1).join('-').toLowerCase();
        script.setAttribute('async', true);
        script.setAttribute('src', `${wcRoot}webui/${wc}${wcMin}.js`)
        document.head.append(script);
        console.info(`Added ${wcLabel} ${wc}`);
    }
    function checkNodes(nodes) {
        if (nodes.length === 0) return;
        nodes.forEach(node => {
            if (node.nodeName.startsWith(wuiPrefix)) {
                processNode(node);
            }
            checkNodes(node.childNodes);
        });
    }
    const startObserving = (domNode) => {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(function (mutation) {
                Array.from(mutation.addedNodes).forEach(el => {
                    if (el.nodeName.startsWith(wuiPrefix)) {
                        processNode(el.nodeName);
                    }
                });
            });
        });
        observer.observe(domNode, {
            childList: true,
            attributes: true,
            characterData: true,
            subtree: true,
        });
        return observer;
    };
    startObserving(document.body);
    checkNodes(document.childNodes);
}
