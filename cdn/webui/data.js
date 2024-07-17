/* Component used for posting data to app from loaded html */
"use strict"
webui.define("webui-data", {
    connected: (t) => {
        Object.keys(t.dataset).forEach(key => {
            switch (t.dataset[key]) {
                case 'innerText':
                    webui.setData(key, webui.trimLinePreWhitespce(t.innerText));
                    break;
                case 'innerHTML':
                    webui.setData(key, webui.trimLinePreWhitespce(t.innerHTML));
                    break;
                default:
                    let value = t.dataset[key];
                    try {
                        value = JSON.parse(value);
                    } catch (ex) { }
                    webui.setData(key, value);
                    break;
            }
        });
    }
});