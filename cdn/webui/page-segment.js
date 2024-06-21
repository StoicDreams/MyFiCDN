/* Display page segment */
"use strict"
webui.define("webui-page-segment", {
    attr: ['theme', 'elevation'],
    attrChanged: (t, property, value) => {
        switch (property) {
            case 'theme':
                t.setTheme(value);
                break;
        }
    }
});
