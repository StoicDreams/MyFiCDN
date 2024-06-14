/* This script is used to dynamically load app hosted web components (app-*) from /wc/*.min.js as they are encountered in the dom. */
{
    const wcPrefix = `APP-`;
    const wcLoading = {};
    const wcLoaded = {};
    const wcRoot = '/wc';
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
        script.setAttribute('src', `${wcRoot}/${wc}${wcMin}.js`)
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
            if (node.nodeName.startsWith(wcPrefix)) {
                processNode(node.nodeName);
            }
            checkNodes(node.childNodes);
        });
    }
    const startObserving = (domNode) => {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(function (mutation) {
                if (mutation.target.nodeName.startsWith(wcPrefix) && mutation.type === 'attributes' && mutation.attributeName === 'preload') {
                    componentPreload(mutation.target);
                }
                Array.from(mutation.addedNodes).forEach(el => {
                    if (el.nodeName.startsWith(wcPrefix)) {
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
