/* Display side-by-side content */
"use strict"
webui.define("webui-side-by-side", {
    attr: ['elevation', 'theme'],
    attrChanged: (t, property, value) => {
        switch (property) {
            case 'theme':
                t.setTheme(value);
                break;
        }
    }
});
