
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
            constructor() {
                const t = this;
            },
            props: {
                'sample': {
                    get() { return this._sample; },
                    set(v) { this._sample = v; }
                }
            },
            flags: [],
            attr: ['height', 'max-height'],
            attrChanged(property, value) {
                const t = this;
                switch (property) {
                    case 'height':
                        t.style.height = webui.pxIfNumber(value);
                        break;
                    case 'maxHeight':
                        t.style.maxHeight = webui.pxIfNumber(value);
                        break;
                }
            },
            connected() {
                const t = this;
                t.setupComponent();
            },
            disconnected() {
                const t = this;
            },
            reconnected() {
                const t = this;
            },
            setupComponent() {
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
            watchVisibility: false,
            isInput: false,
            preload: '',
            constructor(){
                const t = this;
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
            attrChanged(property, value) {
                const t = this;
                switch (property) {
                    case 'height':
                        t.style.height = webui.pxIfNumber(value);
                        break;
                    case 'maxHeight':
                        t.style.maxHeight = webui.pxIfNumber(value);
                        break;
                }
            },
            connected() {
                const t = this;
                t.setupComponent();
            },
            disconnected() {
                const t = this;
            },
            reconnected() {
                const t = this;
            },
            setupComponent() {
                const t = this;
            },
            shadowTemplate: `
    <slot></slot>
    <slot name="something"></slot>
    <style type="text/css">
    :host {
    display:block;
    padding:var(--padding);
    border-radius:var(--corners);
    background-color:var(--theme-color);
    color:var(--theme-color-offset);
    }
    button:focus-visible {
    outline:var(--focus-outline);
    outline-offset:var(--focus-offset);
    }
    </style>
    `
        });
    }
```

## Styling Shadow DOM

The Web UI stylesheet does not reach inside a component's shadow DOM, but CSS variables do, because they inherit through it. Style shadow DOM with the variables below so components follow the site's theme. Content that should look like the rest of the page, such as markdown or forms, belongs in a `<slot>`, where page styles apply.

The `linkCss` option, which added the whole stylesheet to every instance, is deprecated.

| Variable | Use |
| --- | --- |
| `--theme-color`, `--theme-color-offset` | Background and text of the current theme. A `theme` attribute sets them. |
| `--color-{name}`, `--color-{name}-offset` | Theme colors: `title`, `primary`, `secondary`, `tertiary`, `info`, `success`, `warning`, `danger`, `active`, `button`, `action`, `footer`, `background`. |
| `--font-family`, `--font-family-mono`, `--font-family-emoji` | Text, code, and emoji fonts. |
| `--font-size-small`, `--font-size-label`, `--min-font-size` | Smaller text that stays readable. |
| `--padding`, `--button-padding` | Spacing. |
| `--corners`, `--corners-round` | Corner radius, and the radius for round buttons and badges. |
| `--focus-outline`, `--focus-offset`, `--color-focus` | The keyboard focus ring. |
| `--color-backdrop`, `--backdrop-blur` | Behind dialogs and panels. |
| `--color-overlay`, `--color-overlay-offset` | Controls drawn over images and video. |
| `--color-scrollbar`, `--color-scrollbar-thumb` | Scrollbars. |
| `--shadow-popup`, `--shadow-float`, `--shadow-panel` | Shadows for menus, floating buttons, and panels. |
| `--elevation-{0-25}` | The same shadows as the `elevation` attribute. |
| `--color-code`, `--color-code-background`, `--color-code-muted` | Code and diff views. |
| `--color-diff-added`, `--color-diff-removed` | Added and removed lines. |
| `--color-paper`, `--color-paper-offset` | Writing areas. |
| `--main-transition`, `--transition-speed` | Animation timing. |

A site changes any of these in its own CSS, on `:root` or on a single element.

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
                    constructor() {
                        const t = this;
                    },
                    props: {
                        'sample': {
                            get() { return this._sample; },
                            set(v) { this._sample = v; }
                        }
                    },
                    flags: [],
                    attr: ['height', 'max-height'],
                    attrChanged(property, value) {
                        const t = this;
                        switch (property) {
                            case 'height':
                                t.style.height = webui.pxIfNumber(value);
                                break;
                            case 'maxHeight':
                                t.style.maxHeight = webui.pxIfNumber(value);
                                break;
                        }
                    },
                    connected() {
                        const t = this;
                        t.setupComponent();
                    },
                    disconnected() {
                        const t = this;
                    },
                    reconnected() {
                        const t = this;
                    },
                    setupComponent() {
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
                            watchVisibility: false,
                    isInput: false,
                    preload: '',
                    constructor() {
                        const t = this;
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
                    attrChanged(property, value) {
                        const t = this;
                        switch (property) {
                            case 'height':
                                t.style.height = webui.pxIfNumber(value);
                                break;
                            case 'maxHeight':
                                t.style.maxHeight = webui.pxIfNumber(value);
                                break;
                        }
                    },
                    connected() {
                        const t = this;
                        t.setupComponent();
                    },
                    disconnected() {
                        const t = this;
                    },
                    reconnected() {
                        const t = this;
                    },
                    setupComponent() {
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
