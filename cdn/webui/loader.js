/* This script is used to dynamically load web components as webui-* components are encountered in the dom. */
{
    const wuiPrefix = `WEBUI-`;
    const wcLoading = {};
    const wcLoaded = {};
    const wcRoot = location.hostname === '127.0.0.1' ? '' : 'https://cdn.myfi.ws/';
    const wcMin = wcRoot === '' ? '' : '.min';
    function processNode(nodeName) {
        if (wcLoading[nodeName]) return;
        wcLoading[nodeName] = true;
        loadComponent(nodeName.split('-').splice(1).join('-').toLowerCase());
    }
    function loadComponent(wc) {
        if (wcLoaded[wc]) return;
        wcLoaded[wc] = true;
        let script = document.createElement('script');
        script.setAttribute('async', true);
        script.setAttribute('src', `${wcRoot}webui/${wc}${wcMin}.js`)
        document.head.append(script);
    }
    function componentPreload(el) {
        if (!el) return;
        let pl = el.getAttribute('preload');
        if (pl) {
            pl.replace(';', ' ').replace(',', ' ').split(' ').forEach(loadComponent);
        }
    }
    function checkNodes(nodes) {
        if (nodes.length === 0) return;
        nodes.forEach(node => {
            if (node.nodeName.startsWith(wuiPrefix)) {
                processNode(node.nodeName);
            }
            checkNodes(node.childNodes);
        });
    }
    const startObserving = (domNode) => {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(function (mutation) {
                if (mutation.target.nodeName.startsWith('WEBUI-') && mutation.type === 'attributes' && mutation.attributeName === 'preload') {
                    componentPreload(mutation.target);
                }
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
    componentPreload(document.querySelector('webui-app'));
}
