"use strict"
{
    const srcRoot = webui.getData('appName') === 'MyFi CDN' ? '/icons/' : 'https://cdn.myfi.ws/icons/';
    const previewHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200">
<!--! Stoic Dreams - https://webui.stoicdreams.com License - https://webui.stoicdreams.com/license Copyright 2024 Stoic Dreams Inc. -->
<path class="i1" d=""></path>
<path class="i2" d=""></path>
<path class="i3" d=""></path>
<path class="i4" d=""></path>
<path class="i5" d=""></path>
<path class="i6" d=""></path>
<path class="i7" d=""></path>
<path class="i8" d=""></path></svg>`;
    webui.define('webui-icon-creator', {
        preload: "icon dropdown",
        constructor: (t) => {
            t._topGrid = webui.create('webui-grid', { columns: '1fr 1fr', gap: '1' });
            t._leftGrid = webui.create('webui-grid', { gap: '1', theme: 'black', width: '100', height: '100' });
            t._rightGrid = webui.create('webui-grid', { gap: '1', theme: 'white', width: '100', height: '100' });
            t._topGrid.appendChild(t._leftGrid);
            t._topGrid.appendChild(t._rightGrid);
            t._iconOptions = webui.create('webui-flex', { justify: 'center' });
            t._inputs = webui.create('webui-grid', { columns: '1fr 1fr' });
            t._svgContainer = webui.create('div', { style: 'display:block;position:relative;aspect-ratio:1;padding:0;margin:0;' });
            t._svgPreview = webui.createFromHTML(previewHTML, { style: 'aspect-ratio:1;background-color:#DDF;color:#333;stroke:blue;stroke-width:15;fill:#FFFF0088;' });
            t._svgContainer.appendChild(t._svgPreview);
            t._svgPPaths = [];
            function setPlaceholderCoord(path, index) {
                let y = -100 + 2 + (index * 4);
                path._cOrigin = { x: -100, y: y };
                let cq = [];
                for (let q = 1; q < 12; ++q) {
                    cq.push({ x: -100 + (q * 5), y: y, qx: -100 + (q * 5), qy: y });
                }
                path._cQ = cq;
                path._buildDef();
                return path;
            }
            for (let i = 1; i <= 8; ++i) {
                let path = t._svgPreview.querySelector(`.i${i}`);
                t._svgPPaths.push(path);
                t._svgPreview.appendChild(path);
                path._buildDef = function () {
                    let d = [];
                    d.push(`M${path._cOrigin.x} ${path._cOrigin.y}`);
                    path._cQ.forEach(cq => {
                        d.push(`Q${cq.qx} ${cq.qy} ${cq.x} ${cq.y}`);
                    });
                    let ds = d.join('') + 'z';
                    if (path.getAttribute('d') !== ds) {
                        path.setAttribute('d', ds);
                    }
                    return ds;
                }
                setPlaceholderCoord(path, i - 1);
            }
            function getGrabStyle(color, z) {
                return `position:absolute;aspect-ratio:1;width:2.5%;border-radius:100%;transform:translate(-50%,-50%);background-color:${color};z-index:${z};`;
            }
            t._svgPreview.addEventListener('click', ev => {
                if (!moving) return;
                ev.stopPropagation();
                ev.preventDefault();
                return false;
            });
            t._svgPreview.addEventListener('contextmenu', ev => {
                ev.stopPropagation();
                ev.preventDefault();
                return false;
            });
            t._svgPreview.addEventListener('mousedown', ev => {
                ev.stopPropagation();
                ev.preventDefault();
                return false;
            });
            function processMove(ev) {
                let x = ev.pageX;
                let y = ev.pageY;
                let mx = x - moving._moveOX;
                let my = y - moving._moveOY;
                if (moving._isQuad) {
                    moving._myData.qx = moving._dataOX + pxToPath(mx);
                    moving._myData.qy = moving._dataOY + pxToPath(my);
                    moving.style.top = `${pathToRel(moving._myData.qy)}%`;
                    moving.style.left = `${pathToRel(moving._myData.qx)}%`;
                } else {
                    moving._myData.x = moving._dataOX + pxToPath(mx);
                    moving._myData.y = moving._dataOY + pxToPath(my);
                    moving.style.top = `${pathToRel(moving._myData.y)}%`;
                    moving.style.left = `${pathToRel(moving._myData.x)}%`;
                }
                buildIconDef();
            }
            t._svgPreview.addEventListener('mousemove', ev => {
                if (!moving) return;
                ev.stopPropagation();
                ev.preventDefault();
                processMove(ev);
                return false;
            });
            t._svgPreview.addEventListener('mouseup', ev => {
                if (!moving) return;
                ev.stopPropagation();
                ev.preventDefault();
                moving = null;
                return false;
            });
            t._svgPreview.addEventListener('mouseleave', ev => {
                if (!moving || ev.relatedTarget !== 'svg') return;
                ev.stopPropagation();
                ev.preventDefault();
                moving = null;
                return false;
            });
            let moving = null, movingPair = null;
            function setupGrabberEvents(grabber, data, isQuad, pairGrabber) {
                grabber._myData = data;
                grabber._isQuad = !!isQuad;
                grabber.addEventListener('mouseup', ev => {
                    moving = null;
                    movingPair = null;
                });
                grabber.addEventListener('mousemove', ev => {
                    if (!moving) return;
                    ev.stopPropagation();
                    ev.preventDefault();
                    processMove(ev);
                    return false;
                });
                grabber.addEventListener('mousedown', ev => {
                    ev.stopPropagation();
                    ev.preventDefault();
                    console.log('shift', ev.shiftKey);
                    moving = grabber;
                    if (ev.shiftKey && pairGrabber) {
                        movingPair = pairGrabber;
                    }
                    grabber._dataOX = isQuad ? data.qx : data.x;
                    grabber._dataOY = isQuad ? data.qy : data.y;
                    grabber._moveOX = ev.pageX;
                    grabber._moveOY = ev.pageY;
                    return false;
                });
            }
            function buildIconDef() {
                let builder = [];
                builder.push(defName);
                t._svgPPaths.forEach(path => {
                    let line = path._buildDef();
                    if (line.startsWith('M-100')) return;
                    builder.push(line);
                });
                let value = builder.join('\n');
                t._input.value = value;
                icons.forEach(icon => {
                    icon.setIconDefinition(value);
                });
            }
            t._svgPPaths.forEach(path => {
                path._grab = {
                    main: webui.create('a', { style: getGrabStyle('purple', 100) }),
                    quads: []
                }
                setupGrabberEvents(path._grab.main, path._cOrigin, false);
                t._svgContainer.appendChild(path._grab.main);
                for (let gi = 0; gi < 11; ++gi) {
                    let g = {
                        main: webui.create('a', { style: getGrabStyle('red', 101) }),
                        quad: webui.create('a', { style: getGrabStyle('green', 102) })
                    };
                    setupGrabberEvents(g.main, path._cQ[gi], false);
                    setupGrabberEvents(g.quad, path._cQ[gi], true);
                    path._grab.quads.push(g);
                    t._svgContainer.appendChild(g.main);
                    t._svgContainer.appendChild(g.quad);
                }

            });
            let lastDrawn = '';
            function pathToRel(p) {
                return (p + 100) * 0.5;
            }
            function pxToPath(px) {
                let size = t._svgPreview.clientWidth;
                let ratio = 200 / size;
                return Math.round(px * ratio);
            }
            function relToPath(r) {
                return (r * 2) - 100;
            }
            function setGrabPositions(path) {
                path._grab.main.style.top = `${pathToRel(path._cOrigin.y)}%`;
                path._grab.main.style.left = `${pathToRel(path._cOrigin.x)}%`;
                let index = 0;
                path._grab.quads.forEach(quad => {
                    let d = path._cQ[index++];
                    quad.main.style.left = `${pathToRel(d.x)}%`;
                    quad.main.style.top = `${pathToRel(d.y)}%`;
                    quad.quad.style.left = `${pathToRel(d.qx)}%`;
                    quad.quad.style.top = `${pathToRel(d.qy)}%`;
                });
            }
            function setupPath(path) {
                if (path.getAttribute('d').startsWith('M-100')) {
                    path.style.strokeWidth = '2';
                } else {
                    path.style.strokeWidth = '5';
                }
                setGrabPositions(path);
            }
            function getCoord(subdef) {
                let c = { x: 0, y: 0, qx: 0, qy: 0 };
                let s = '';
                let index = 0;
                let isM = false;
                function setValue() {
                    let val = parseFloat(s);
                    s = '';
                    if (++index === 1) {
                        if (isM) {
                            c.x = val;
                        } else {
                            c.qx = val;
                        }
                    } else if (index === 2) {
                        if (isM) {
                            c.y = val;
                        } else {
                            c.qy = val;
                        }
                    } else if (index === 3) {
                        c.x = val;
                    } else if (index === 4) {
                        c.y = val;
                    }
                }
                subdef.split('').forEach(char => {
                    switch (char) {
                        case 'M':
                            isM = true;
                            break;
                        case 'Z':
                        case 'm':
                        case 'z':
                            break;
                        case ' ':
                            if (s !== '') {
                                setValue();
                            }
                            break;
                        case '-':
                            if (s !== '') {
                                setValue();
                            }
                            s = '-';
                            break;
                        default:
                            s = `${s}${char}`;
                            break;
                    }
                });
                if (s !== '') {
                    setValue();
                }
                return c;
            }
            function setPathDefinition(path, definition) {
                let segments = definition.split('Q');
                let main = getCoord(segments.shift());
                path._cOrigin.x = main.x;
                path._cOrigin.y = main.y;
                let index = 0;
                while (segments.length > 0) {
                    let quad = getCoord(segments.shift());
                    let i = index++;
                    path._cQ[i].x = quad.x;
                    path._cQ[i].y = quad.y;
                    path._cQ[i].qx = quad.qx;
                    path._cQ[i].qy = quad.qy;
                }
                path._buildDef();
            }
            let defName = 'WEBUI-ICON-NAME';
            function setPreview(definition) {
                if (!definition) return;
                if (definition === lastDrawn) return;
                lastDrawn = definition;
                let lines = definition.split('\n');
                if (lines.length === 0) return;
                if (lines[0].startsWith('WEBUI-ICON-')) {
                    defName = lines.shift();
                }
                let i = 0;
                while (i < lines.length && i < t._svgPPaths.length) {
                    if (lines[i]) {
                        setPathDefinition(t._svgPPaths[i], lines[i]);
                    } else {
                        setPlaceholderCoord(t._svgPPaths[i], i);
                    }

                    setupPath(t._svgPPaths[i]);
                    ++i;
                }
                while (i < t._svgPPaths.length) {
                    setPlaceholderCoord(t._svgPPaths[i], i);
                    setupPath(t._svgPPaths[i]);
                    ++i;
                }
            }
            t._inputs.appendChild(t._svgContainer);
            let icons = [];
            [{ l: 'Regular', d: {} },
            { l: 'Thin', d: { thin: '' } },
            { l: 'Thick', d: { thick: '' } },
            { l: 'Square', d: { square: '' } },
            { l: 'Circle', d: { circle: '' } },
            { l: 'Bordered Square', d: { square: '', bordered: '' } },
            { l: 'Bordered Circle', d: { circle: '', bordered: '' } },
            { l: 'Duo-Tone', d: { duo: '' } },
            { l: 'Tri-Tone', d: { tri: '' } },
            { l: 'Inverted', d: { inverted: '' } }].forEach(def => {
                let attributes = def.d;
                attributes.width = '100px';
                attributes.class = 'my-1';
                let iconLeft = webui.create('webui-icon', attributes);
                let iconRight = webui.create('webui-icon', attributes);
                icons.push(iconLeft);
                icons.push(iconRight);
                let left = webui.create('webui-flex', { column: '1' });
                let right = webui.create('webui-flex', { column: '1' });
                t._leftGrid.appendChild(left);
                left.appendChild(iconLeft);
                left.appendChild(webui.create('label', { text: def.l, class: 'text-center' }));
                t._rightGrid.appendChild(right);
                right.appendChild(iconRight);
                right.appendChild(webui.create('label', { text: def.l, class: 'text-center' }));
            });
            t._color = webui.create('webui-dropdown', { 'label': 'Icon Theme' });
            t._color.addEventListener('change', _ => {
                let theme = t._color.value;
                t._topGrid.querySelectorAll('webui-icon').forEach(icon => {
                    if (!theme) {
                        icon.removeAttribute('theme');
                    } else {
                        icon.setAttribute('theme', theme);
                    }
                });
            });
            function setupToggleIcon(name, label, flagAttr) {
                t[name] = webui.create('webui-toggle-icon', { label: label, 'title-on': `Disable ${label}`, 'title-off': `Enable ${label}`, 'theme-on': 'success', 'theme-off': 'shade' });
                t[name].addEventListener('change', _ => {
                    icons.forEach(icon => {
                        if (t[name].value) {
                            icon.setAttribute(flagAttr, '');
                        } else {
                            icon.removeAttribute(flagAttr);
                        }
                    });
                });
            }
            setupToggleIcon('_backingToggle', 'Backing', 'backing');
            setupToggleIcon('_sharpToggle', 'Sharp', 'sharp');
            setupToggleIcon('_fillToggle', 'Fill', 'fill');
            t._input = webui.create('webui-input-message', { 'label': `Definition`, value: 'WEBUI-ICON-DEF\n', placeholder: "WEBUI-ICON-NAME" });
            t._inputs.appendChild(t._input);
            t._input.addEventListener('input', _ => {
                let value = t._input.value;
                if (!value) {
                    t._input.value = 'WEBUI-ICON-DEF';
                    return;
                }
                setPreview(value);
                icons.forEach(icon => {
                    icon.setIconDefinition(value);
                });
            });
            t._bottomGrid = webui.create('webui-grid', { gap: '1', theme: 'inherit', width: '100', height: '100' });
        },
        connected: (t) => {
            t.style.display = 'flex';
            t.style.flexDirection = 'column';
            t.style.flexGap = 'var(--padding)';
            t.appendChild(t._topGrid);
            t.appendChild(t._iconOptions);
            t._iconOptions.appendChild(t._color);
            t._iconOptions.appendChild(t._backingToggle);
            t._iconOptions.appendChild(t._sharpToggle);
            t._iconOptions.appendChild(t._fillToggle);
            t.appendChild(t._inputs);
            t.appendChild(t._bottomGrid);
            t.loadIcons();
            let options = JSON.stringify([
                { value: '', display: 'None' },
                { value: 'black', display: 'Black' },
                { value: 'white', display: 'White' },
                { value: 'title', display: 'Title' },
                { value: 'primary', display: 'Primary' },
                { value: 'secondary', display: 'Secondary' },
                { value: 'tertiary', display: 'Tertiary' },
                { value: 'info', display: 'info' },
                { value: 'success', display: 'success' },
                { value: 'warning', display: 'warning' },
                { value: 'danger', display: 'danger' },
                { value: 'active', display: 'Active' },
                { value: 'button', display: 'Button' },
                { value: 'action', display: 'Action' }
            ]);
            t._color.setAttribute('options', options);
        },
        loadFromDefinition: function (iconDef) {
            let t = this;
            if (!iconDef) return;
        },
        loadIcons: async function () {
            let t = this;
            try {
                let result = await fetch(`${srcRoot}all.json`);
                if (!result.ok) return;
                let icons = await result.json();
                let isFirst = true;
                icons.forEach(icon => {
                    let container = webui.create('a', { style: 'flex-direction:column;' });
                    t._bottomGrid.appendChild(container);
                    let el = webui.create('webui-icon', { icon: icon, width: '100' });
                    container.appendChild(el);
                    let label = webui.create('label', { text: icon });
                    container.appendChild(label);
                    container.addEventListener('click', _ => {
                        t._input.value = el._definition;
                        t._input.dispatchEvent(new Event('input', { bubbles: true }));
                    });
                    if (isFirst) {
                        isFirst = false;
                        setTimeout(() => {
                            t._input.value = el._definition;
                            t._input.dispatchEvent(new Event('input', { bubbles: true }));
                        }, 100);
                    }
                });
            } catch (ex) {
                console.error('Failed loading icons list', ex);
            }
        }
    });
}
