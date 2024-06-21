/* Display paper element. */
"use strict"
webui.define("webui-paper", {
    attr: ['elevation', 'theme'],
    attrChanged: (t, property, value) => {
        switch (property) {
            case 'theme':
                t.setTheme(value);
                break;
        }
    }
});
