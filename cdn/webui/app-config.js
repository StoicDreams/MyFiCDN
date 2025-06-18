"use strict"
{
    const appConfig = {};
    webui.define('webui-app-config', {
        constructor: (t) => {
            webui.appConfig = appConfig;
        },
        attr: ['src'],
        connected: (t) => {
            for (const attr of t.attributes) {
                if (['src'].indexOf(attr.name) !== -1) continue;
                appConfig[attr.name] = attr.value;
                webui.setData(attr.name, attr.value);
            }
            if (t.src) {
                fetch(t.src)
                    .then(result => result.json())
                    .then(data => {
                        Object.keys(data).forEach(key => {
                            appConfig[key] = data[key];
                            webui.setData(key, data[key]);
                        });
                        webui.loadRoles();
                    })
                    .catch(err => {
                        console.error('Failed loading app config from src', err);
                    });
            }
        }
    });
}
