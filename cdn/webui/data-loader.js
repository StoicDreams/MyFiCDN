"use strict"
{
    webui.define("webui-data-loader", {
        constructor: (t) => {
            t.map = {};
            t.delay = 10;
        },
        attr: ['src', 'keymap', 'auth', 'apiroot', 'delay'],
        attrChanged: (t, property, value) => {
            switch (property) {
                case 'auth':
                    t.usesAuth = true;
                    break;
                case 'delay':
                    t.delay = parseInt(value) || 10;
                    break;
                case 'keymap':
                    try {
                        t.map = JSON.parse(value);
                    } catch (_) { }
                    break;
            }
            if (t.isProcessed) {
                t.process();
            }
        },
        connected: (t) => {
            t.process();
        },
        processPath: async function (src, dataKey) {
            let t = this;

            async function handleProcess() {
                if (t.usesAuth && !t.auth) {
                    console.error('webui-data-loader cannot load data: [auth] is not set with a data key.');
                    return;
                }
                let fo = { headers: {} };
                if (src.startsWith('http')) { fo.mode = 'cors'; }
                if (t.auth) {
                    fo.headers.Authorization = webui.getData(t.auth);
                    if (!fo.headers.Authorization) {
                        console.error('webui-data-loader cannot load data: auth key did not find expected data.');
                        return;
                    }
                }
                try {
                    let result = await fetch(src, fo);
                    if (!result.ok) {
                        console.error('webui-data-loader failed: request returned invalid response', result);
                        return;
                    }
                    let payload = await result.text();
                    webui.setData(webui.toSnake(dataKey), payload);
                } catch (ex) {
                    console.error('webui-data-loader failed loading data:', ex);
                    return;
                }
            }
            setTimeout(() => {
                handleProcess();
            }, t.delay || 10);
        },
        process: async function () {
            let t = this;
            if (!t._sid) {
                t._sid = webui.uuid();
            }
            t._attempts = (t._attempts || 0) + 1;
            t.isProcessed = true;
            if (t.auth && !webui.getData(t.auth)) {
                if (t._attempts > 4) {
                    console.error(`webui-data-loader failed: Expected auth ${t.auth} returned invalid data.`);
                    return;
                }
                setTimeout(() => {
                    t.process();
                }, Math.pow(10, t._attempts));
                return;
            }
            let apiRoot = '';
            if (t.apiroot) {
                apiRoot = webui.getData(t.apiroot);
                if (!apiRoot) {
                    if (t._attempts > 4) {
                        console.error(`webui-data-loader failed: Expected api root ${t.apiroot} returned invalid data.`);
                        return;
                    }
                    setTimeout(() => {
                        t.process();
                    }, Math.pow(10, t._attempts));
                    return;
                }
            }
            if (t.src) {
                if (t.dataset.trigger) {
                    t.processPath(`${apiRoot}${t.src}`, t.dataset.trigger);
                    t.dataset.trigger = undefined;
                    t.src = undefined;
                } else {
                    console.error('webui-data-loader failed: src must be used in conjunction with a data-setter to signify which data key to assign data to.');
                }
            }
            Object.keys(t.dataset).forEach(key => {
                let apiRoute = t.dataset[key];
                if (!!apiRoot) {
                    let src = `${apiRoot}${apiRoute}`;
                    t.processPath(src, key);
                }
            });
        }
    });
}