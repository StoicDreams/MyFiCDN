
<webui-page-segment elevation="10">
    Web UI supports developers creating custom web components that can be used in their applications. Custom web components will load from your website's `/wc` folder.
</webui-page-segment>

## Templates for Custom Web UI Components

```javascript:template.js - Custom Web Component
    "use strict"
    {
        webui.define("app-template", {
            content: true,
            watchVisibility: false,
            isInput: false,
            preload: '',
            constructor: (t) => { },
            props: {
                'sample': {
                    get() { return this._sample; },
                    set(v) { this._sample = v; }
                }
            },
            flags: [],
            attr: ['height', 'max-height'],
            attrChanged: (t, property, value) => {
                switch (property) {
                    case 'height':
                        t.style.height = webui.pxIfNumber(value);
                        break;
                    case 'maxHeight':
                        t.style.maxHeight = webui.pxIfNumber(value);
                        break;
                }
            },
            connected: function (t) {
                t.setupComponent();
            },
            disconnected: function (t) { },
            reconnected: function (t) { },
            setupComponent: function () {
                const t = this;
            },
        });
    }
```

```javascript:shadow-template.js - With Shadow DOM
    "use strict"
    {
        webui.define("app-shadow-template", {
            content: true,
            linkCss: false,
            watchVisibility: false,
            isInput: false,
            preload: '',
            constructor: (t) => {
                t._slotMain = t.template.querySelector('slot:not([name])');
                t._slotSomething = t.template.querySelector('slot[name="something"]');
            },
            props: {
                'sample': {
                    get() { return this._sample; },
                    set(v) { this._sample = v; }
                }
            },
            flags: [],
            attr: ['height', 'max-height'],
            attrChanged: (t, property, value) => {
                switch (property) {
                    case 'height':
                        t.style.height = webui.pxIfNumber(value);
                        break;
                    case 'maxHeight':
                        t.style.maxHeight = webui.pxIfNumber(value);
                        break;
                }
            },
            connected: function (t) {
                t.setupComponent();
            },
            disconnected: function (t) { },
            reconnected: function (t) { },
            setupComponent: function () {
                const t = this;
            },
            shadowTemplate: `
    <slot></slot>
    <slot name="something"></slot>
    <style type="text/css">
    :host {
    }
    </style>
    `
        });
    }
```

<webui-restrict-to-role role="1073741824" class="content">
    <template slot="valid">
        ## Templates for Web UI Components
        ```javascript:template.js - Custom Web Component
            /*!
            * Web UI  - https://webui.stoicdreams.com
            * .
            * Authored by Erik Gassler - Stoic Dreams
            * Copyright © 2025 Stoic Dreams - https://www.stoicdreams.com
            * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
            */
            "use strict"
            {
                webui.define("webui-template", {
                    content: true,
                    watchVisibility: false,
                    isInput: false,
                    preload: '',
                    constructor: (t) => { },
                    props: {
                        'sample': {
                            get() { return this._sample; },
                            set(v) { this._sample = v; }
                        }
                    },
                    flags: [],
                    attr: ['height', 'max-height'],
                    attrChanged: (t, property, value) => {
                        switch (property) {
                            case 'height':
                                t.style.height = webui.pxIfNumber(value);
                                break;
                            case 'maxHeight':
                                t.style.maxHeight = webui.pxIfNumber(value);
                                break;
                        }
                    },
                    connected: function (t) {
                        t.setupComponent();
                    },
                    disconnected: function (t) { },
                    reconnected: function (t) { },
                    setupComponent: function () {
                        const t = this;
                    },
                });
            }
        ```

        ```javascript:shadow-template.js - With Shadow DOM
            /*!
            * Web UI  - https://webui.stoicdreams.com
            * .
            * Authored by Erik Gassler - Stoic Dreams
            * Copyright © 2025 Stoic Dreams - https://www.stoicdreams.com
            * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
            */
            "use strict"
            {
                webui.define("webui-shadow-template", {
                    content: true,
                    linkCss: false,
                    watchVisibility: false,
                    isInput: false,
                    preload: '',
                    constructor: (t) => {
                        t._slotMain = t.template.querySelector('slot:not([name])');
                        t._slotSomething = t.template.querySelector('slot[name="something"]');
                    },
                    props: {
                        'sample': {
                            get() { return this._sample; },
                            set(v) { this._sample = v; }
                        }
                    },
                    flags: [],
                    attr: ['height', 'max-height'],
                    attrChanged: (t, property, value) => {
                        switch (property) {
                            case 'height':
                                t.style.height = webui.pxIfNumber(value);
                                break;
                            case 'maxHeight':
                                t.style.maxHeight = webui.pxIfNumber(value);
                                break;
                        }
                    },
                    connected: function (t) {
                        t.setupComponent();
                    },
                    disconnected: function (t) { },
                    reconnected: function (t) { },
                    setupComponent: function () {
                        const t = this;
                    },
                    shadowTemplate: `
            <slot></slot>
            <slot name="something"></slot>
            <style type="text/css">
            :host {
            }
            </style>
            `
                });
            }

        ```
    </template>
</webui-restrict-to-role>
