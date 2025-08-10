/*!
 * Web UI Icon Creator - https://webui.stoicdreams.com/components#webui-icon-creator
 * A component for creating and editing icons within the web UI.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    const dCoordCount = 12;
    const srcRoot = webui.getData('appName') === 'My Fidelity CDN' ? '/icons/' : 'https://cdn.myfi.ws/icons/';
    const previewHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200">
<!--! Stoic Dreams - https://webui.stoicdreams.com License - https://webui.stoicdreams.com/license Copyright 2024 Stoic Dreams Inc. -->
<path d=""></path></svg>`;
    const defaultPath = 'M0 -85Q5 -85 5 -85Q10 -85 10 -85Q15 -85 15 -85Q20 -85 20 -85Q25 -85 25 -85Q30 -85 30 -85Q35 -85 35 -85Q40 -85 40 -85Q45 -85 45 -85Q50 -85 50 -85Q55 -85 55 -85z';
    webui.define('webui-icon-creator', {
        preload: "icon dropdown input-range input-text input-message",
        constructor: (t) => {
        },
        setupComponent: function () {
            const t = this;
            t.style.display = 'flex';
            t.style.flexDirection = 'column';
            t.style.flexGap = 'var(--padding)';
            let colorOptions = JSON.stringify([
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
            let shapeOptions = JSON.stringify([
                { value: '', display: 'Square' },
                { value: 'badge', display: 'Badge' },
                { value: 'circle', display: 'Circle' },
                { value: 'triangle', display: 'Triangle' },
                { value: 'octo', display: 'Octogon' },
            ]);
            t._modPath = 1;
            t._topGrid = webui.create('webui-grid', { name: 'top-grid', columns: '1fr 1fr', gap: '1' });
            t.appendChild(t._topGrid);
            t._leftGrid = webui.create('webui-grid', { name: 'left-grid', gap: '1', theme: 'black', width: '100', height: '100' });
            t._topGrid.appendChild(t._leftGrid);
            t._rightGrid = webui.create('webui-grid', { name: 'right-grid', gap: '1', theme: 'white', width: '100', height: '100' });
            t._topGrid.appendChild(t._rightGrid);
            t._iconOptions = webui.create('webui-flex', { name: 'icon-options', justify: 'center' });
            t.appendChild(t._iconOptions);
            let inputsColumn = webui.create('webui.flex', { column: '' });
            inputsColumn.appendChild(webui.create('h6', { html: `<strong>Movement Modifiers</strong>` }));
            inputsColumn.appendChild(webui.create('p', { class: "pl-4", html: `<strong>CTRL</strong> Precision Movement` }));
            inputsColumn.appendChild(webui.create('p', { class: "pl-4", html: `<strong>SHIFT</strong> Move Pair` }));
            t._iconFlags = webui.create('webui-flex', { name: 'icon-options', justify: 'flex-start', align: 'center', wrap: true, gap: 5, html: `<h6 class="f1">Flags:</h6>` });
            inputsColumn.appendChild(t._iconFlags);
            function setupDropdown(label, attr, options) {
                let dd = webui.create('webui-dropdown', { label: label, options: options });
                inputsColumn.appendChild(dd);
                dd.addEventListener('change', _ => {
                    let value = dd.value;
                    icons.forEach(icon => {
                        if (!value) {
                            icon.removeAttribute(attr);
                        } else {
                            icon.setAttribute(attr, value);
                        }
                    });
                });
            }
            function setupToggleIcon(name, label, flagAttr) {
                t[name] = webui.create('webui-toggle-icon', { label: label, 'title-on': `Disable ${label}`, 'title-off': `Enable ${label}`, 'theme-on': 'success', 'theme-off': 'shade', 'flags-on': 'fill', 'flags-off': '' });
                t[name].addEventListener('change', _ => {
                    icons.forEach(icon => {
                        if (t[name].value) {
                            icon.setAttribute(flagAttr, '');
                        } else {
                            icon.removeAttribute(flagAttr);
                        }
                    });
                });
                t._iconFlags.appendChild(t[name]);
            }
            setupDropdown('Icon Theme', 'theme', colorOptions);
            setupDropdown('Shape', 'shape', shapeOptions);
            setupDropdown('Stroke', 'stroke', JSON.stringify([
                { value: '', display: 'Regular' },
                { value: 'thin', display: 'Thin' },
                { value: 'thick', display: 'Thick' }
            ]));
            setupDropdown('Shade', 'shade', JSON.stringify([
                { value: '', display: 'Regular' },
                { value: 'duo', display: 'Duo' },
                { value: 'tri', display: 'Trio' }
            ]));
            let rotate = webui.create('webui-input-range', { label: 'Rotation', min: 0, max: 355, step: 5 });
            inputsColumn.appendChild(rotate);
            rotate.addEventListener('input', _ => {
                let value = rotate.value;
                icons.forEach(icon => {
                    if (value > 0) {
                        icon.setAttribute('rotate', value);
                    } else {
                        icon.removeAttribute('rotate');
                    }
                });
            });
            setupToggleIcon('_backingToggle', 'Backing', 'backing');
            setupToggleIcon('_sharpToggle', 'Sharp', 'sharp');
            setupToggleIcon('_fillToggle', 'Fill', 'fill');
            setupToggleIcon('_borderToggle', 'Bordered', 'bordered');
            setupToggleIcon('_banToggle', 'Ban', 'ban');

            t._inputs = webui.create('webui-grid', { columns: '1fr 1fr' });
            t.appendChild(t._inputs);
            t._svgContainer = webui.create('div', { style: 'display:block;position:relative;aspect-ratio:1;padding:0;margin:0;' });
            t._inputs.appendChild(t._svgContainer);
            t._backingHTML = webui.create('div', { 'style': 'width:100%;height:100%;overflow:hidden;position:absolute;z-index:0;top:0;left:0;color:orange;' });
            t._svgContainer.appendChild(t._backingHTML);
            t._svgPreview = webui.createFromHTML(previewHTML, { style: 'aspect-ratio:1;position:relative;z-index:1;color:#333;stroke:blue;stroke-width:4;fill:#FFFF0022;' });
            t._previewPath = t._svgPreview.querySelector('path');
            t._iconPreview = webui.create('webui-icon', { style: 'position:absolute;width:100%;top:0;left:0;opacity:0.5;' });
            t._svgContainer.appendChild(t._iconPreview);
            t._svgContainer.appendChild(t._svgPreview);
            t._inputFull = webui.create('webui-input-message', { 'label': `Definition`, value: 'WEBUI-ICON-DEF\n', placeholder: "WEBUI-ICON-NAME" });
            inputsColumn.appendChild(t._inputFull);
            t._inputPath = webui.create('webui-input-message', { 'label': `Definition`, value: '', placeholder: "" });
            let pathOptions = [];
            for (let p = 1; p <= 8; ++p) {
                pathOptions.push({ value: `${p}` });
            }
            t._selectPath = webui.create('webui-dropdown', { label: 'Select Path to Edit', options: JSON.stringify(pathOptions) });
            inputsColumn.appendChild(t._selectPath);
            t._selectPath.addEventListener('change', _ => {
                let changeTo = t._selectPath.value;
                t._modPath = t._selectPath.value;
                let lines = checkForValidInput(true);
                let pathCount = lines.length - 1;
                if (changeTo > pathCount) {
                    if (pathCount >= 8) {
                        t._modPath = pathCount;
                    } else {
                        lines.push(defaultPath);
                        t._modPath = pathCount + 1;
                        t._inputFull.value = lines.join('\n');
                    }
                    t._selectPath.value = t._modPath;
                }
                t._inputPath.value = lines[t._modPath];
                setPreview();
            });
            inputsColumn.appendChild(t._inputPath);
            let bgScale = webui.create('webui-input-range', { label: 'Background Scale', value: '100', min: 25, max: 200, step: 1 });
            inputsColumn.appendChild(bgScale);
            bgScale.addEventListener('input', _ => {
                let value = parseInt(bgScale.value);
                t._backingHTML.style.width = `${value}%`;
                t._backingHTML.style.height = `${value}%`;
                if (value !== 0) {
                    let offset = (100 - value) / 2;
                    t._backingHTML.style.top = `${offset}%`;
                    t._backingHTML.style.left = `${offset}%`;
                } else {
                    t._backingHTML.style.top = ``;
                    t._backingHTML.style.left = ``;
                }
            });
            t._backingInput = webui.create('webui-input-message', { label: 'Background Tracing', placeholder: 'Enter HTML for preview background to show Image or SVG of desired image to trace over.' });
            inputsColumn.appendChild(t._backingInput);
            t._backingInput.addEventListener('input', _ => {
                t._backingHTML.innerHTML = t._backingInput.value;
                let svg = t._backingHTML.querySelector('svg');
                if (svg) {
                    svg.setAttribute('width', '100%');
                    svg.setAttribute('height', '100%');
                    if (t._backingHTML.innerHTML !== t._backingInput.value) {
                        t._backingInput.value = t._backingHTML.innerHTML;
                    }
                    return;
                }
                let img = t._backingHTML.querySelector('img');
                if (img) {
                    img.setAttribute('width', '100%');
                    img.setAttribute('height', '100%');
                    if (t._backingHTML.innerHTML !== t._backingInput.value) {
                        t._backingInput.value = t._backingHTML.innerHTML;
                    }
                    return;
                }
            });
            const pathCoords = [
                { x: 0, y: 0 },
                { x: -10, y: 0, qx: -10, qy: 0 },
                { x: -20, y: 0, qx: -20, qy: 0 },
                { x: -30, y: 0, qx: -30, qy: 0 },
                { x: -40, y: 0, qx: -40, qy: 0 },
                { x: -50, y: 0, qx: -50, qy: 0 },
                { x: 50, y: 0, qx: 50, qy: 0 },
                { x: 40, y: 0, qx: 40, qy: 0 },
                { x: 30, y: 0, qx: 30, qy: 0 },
                { x: 20, y: 0, qx: 20, qy: 0 },
                { x: 10, y: 0, qx: 10, qy: 0 },
                { x: 0, y: 0, qx: 0, qy: 0 }
            ];
            t._buildDef = function () {
                let d = [];
                d.push(`M${pathCoords[0].x} ${pathCoords[0].y}`);
                for (let path = 1; path < pathCoords.length; ++path) {
                    d.push(`Q${pathCoords[path].qx} ${pathCoords[path].qy} ${pathCoords[path].x} ${pathCoords[path].y}`);
                }
                let ds = d.join('') + 'z';
                if (t._previewPath.getAttribute('d') !== ds) {
                    t._previewPath.setAttribute('d', ds);
                }
                if (t._inputPath.value !== ds) {
                    t._inputPath.value = ds;
                }
                let lines = checkForValidInput();
                lines[t._modPath] = ds;
                let fullDef = lines.join('\n');
                if (fullDef !== t._inputFull.value) {
                    t._inputFull.value = fullDef;
                    setPreview();
                }

                return ds;
            }
            function getGrabStyle(color, z) {
                return `position:absolute;aspect-ratio:1;width:2.5%;border-radius:100%;transform:translate(-50%,-50%);background-color:${color};z-index:${z};`;
            }
            let moving = null, movingPair = [], stepAlt = false;
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
            function applySnapping(value) {
                if (!stepAlt) {
                    return value - (value % 5);
                }
                return value;
            }
            function movePaired(paired, mx, my) {
                if (paired._isQuad) {
                    paired._myData.qx = applySnapping(paired._dataOX + pxToPath(mx));
                    paired._myData.qy = applySnapping(paired._dataOY + pxToPath(my));
                    paired.style.top = `${pathToRel(paired._myData.qy)}%`;
                    paired.style.left = `${pathToRel(paired._myData.qx)}%`;
                } else {
                    paired._myData.x = applySnapping(paired._dataOX + pxToPath(mx));
                    paired._myData.y = applySnapping(paired._dataOY + pxToPath(my));
                    paired.style.top = `${pathToRel(paired._myData.y)}%`;
                    paired.style.left = `${pathToRel(paired._myData.x)}%`;
                }
            }
            function processMove(ev) {
                let x = ev.pageX;
                let y = ev.pageY;
                let mx = x - moving._moveOX;
                let my = y - moving._moveOY;
                stepAlt = ev.ctrlKey;
                if (moving._isQuad) {
                    moving._myData.qx = applySnapping(moving._dataOX + pxToPath(mx));
                    moving._myData.qy = applySnapping(moving._dataOY + pxToPath(my));
                    moving.style.top = `${pathToRel(moving._myData.qy)}%`;
                    moving.style.left = `${pathToRel(moving._myData.qx)}%`;
                } else {
                    moving._myData.x = applySnapping(moving._dataOX + pxToPath(mx));
                    moving._myData.y = applySnapping(moving._dataOY + pxToPath(my));
                    moving.style.top = `${pathToRel(moving._myData.y)}%`;
                    moving.style.left = `${pathToRel(moving._myData.x)}%`;
                }
                movingPair.forEach(paired => {
                    movePaired(paired, mx, my);
                });
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
            function setupGrabberEvents(grabber, dataIndex, isQuad, pairGrabber) {
                let data = pathCoords[dataIndex];
                grabber._myData = data;
                grabber._isQuad = !!isQuad;
                grabber.addEventListener('mouseup', ev => {
                    moving = null;
                    movingPair = [];
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
                    grabber._dataOX = isQuad ? data.qx : data.x;
                    grabber._dataOY = isQuad ? data.qy : data.y;
                    grabber._moveOX = ev.pageX;
                    grabber._moveOY = ev.pageY;
                    moving = grabber;
                    if (ev.shiftKey && pairGrabber) {
                        movingPair = [pairGrabber];
                        pairGrabber._dataOX = isQuad ? data.x : data.qx;
                        pairGrabber._dataOY = isQuad ? data.y : data.qy;
                    } else if (ev.shiftKey) {
                        let index = 1;
                        grabbers.slice(1).forEach(pairSet => {
                            let data = pathCoords[index++];
                            [pairSet.main, pairSet.quad].forEach(paired => {
                                paired._dataOX = paired._isQuad ? data.qx : data.x;
                                paired._dataOY = paired._isQuad ? data.qy : data.y;
                            });
                        });
                        movingPair = [];
                        grabbers.slice(1).forEach(pairSet => {
                            movingPair.push(pairSet.main);
                            movingPair.push(pairSet.quad);
                        });
                    } else {
                        movingPair = [];
                    }
                    stepAlt = ev.ctrlKey;
                    return false;
                });
            }
            function buildIconDef() {
                let builder = [];
                let index = 0;
                pathCoords.forEach(coord => {
                    if (index++ === 0) {
                        builder.push(`${coord.x} ${coord.y}`);
                    } else {
                        builder.push(`${coord.qx} ${coord.qy} ${coord.x} ${coord.y}`);
                    }
                });
                let value = `M${builder.join('Q')}z`;
                t._inputPath.value = value;
                t._buildDef();
            }
            let grabbers = [];
            grabbers.push({
                main: webui.create('a', { style: getGrabStyle('purple', 100) }),
                quads: []
            });
            setupGrabberEvents(grabbers[0].main, 0, false);
            t._svgContainer.appendChild(grabbers[0].main);
            for (let gi = 1; gi < dCoordCount; ++gi) {
                grabbers.push({
                    main: webui.create('a', { style: getGrabStyle('red', 101) }),
                    quad: webui.create('a', { style: getGrabStyle('green', 102) })
                });
                setupGrabberEvents(grabbers[gi].main, gi, false, grabbers[gi].quad);
                setupGrabberEvents(grabbers[gi].quad, gi, true, grabbers[gi].main);
                t._svgContainer.appendChild(grabbers[gi].main);
                t._svgContainer.appendChild(grabbers[gi].quad);
            }

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
                for (let index = 0; index < grabbers.length; ++index) {
                    grabbers[index].main.style.left = `${pathToRel(pathCoords[index].x)}%`;
                    grabbers[index].main.style.top = `${pathToRel(pathCoords[index].y)}%`;
                    if (index > 0) {
                        grabbers[index].quad.style.left = `${pathToRel(pathCoords[index].qx)}%`;
                        grabbers[index].quad.style.top = `${pathToRel(pathCoords[index].qy)}%`;
                    }
                }
            }
            function getCoord(subdef) {
                let c = { x: 0, y: 0, qx: 0, qy: 0 };
                let s = '';
                let index = 0;
                let isM = false;
                if (!subdef) return c;
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
            function setPathDefinition(definition) {
                let segments = definition.split('|').pop().split('Q');
                if (definition.startsWith('WEBUI-ICON')) {
                    segments.shift();
                }
                let main = getCoord(segments.shift());
                pathCoords[0].x = main.x;
                pathCoords[0].y = main.y;
                let index = 1;
                while (segments.length > 0) {
                    let line = segments.shift();
                    if (line.startsWith('WEBUI-ICON')) continue;
                    if (!line) continue;
                    if (index >= pathCoords.length) break;
                    let quad = getCoord(line);
                    let i = index++;
                    pathCoords[i].x = quad.x;
                    pathCoords[i].y = quad.y;
                    pathCoords[i].qx = quad.qx;
                    pathCoords[i].qy = quad.qy;
                }
                t._buildDef();
            }
            let defName = 'WEBUI-ICON-NAME';
            function setPreview() {
                let definition = t._inputFull.value;
                if (!definition) return;
                let snapShot = `${t._modPath}|${definition}`;
                if (snapShot === lastDrawn) return;
                lastDrawn = snapShot;
                let lines = definition.split('\n');
                if (lines.length === 0) return;
                if (lines[0].startsWith('WEBUI-ICON-')) {
                    defName = lines.shift();
                }
                if (t._modPath >= lines.length) {
                    t._modPath = lines.length;
                    t._selectPath.value = t._modPath;
                }
                let i = t._modPath - 1;
                if (lines[i]) {
                    setPathDefinition(lines[i]);
                }
                icons.forEach(icon => {
                    icon.setIconDefinition(definition);
                });
                setGrabPositions();
            }
            let icons = [];
            icons.push(t._iconPreview);
            [{ l: 'Regular', d: {} },
            { l: 'Thin', d: { stroke: 'thin' } },
            { l: 'Thick', d: { stroke: 'thick' } },
            { l: 'Duo-Tone', d: { shade: 'duo' } },
            { l: 'Tri-Tone', d: { shade: 'tri' } },
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
            t._inputs.appendChild(inputsColumn);
            function checkForValidInput(skipPathUpdate) {
                let values = t._inputFull.value.split('\n');
                if (values.length === 0) {
                    values.push('WEBUI-ICON-DEF');
                }
                if (values.length === 1) {
                    values.push(defaultPath);
                    if (!skipPathUpdate) {
                        t._inputFull.value = values.join('\n');
                    }
                }
                if (t._modPath > values.length) {
                    t._modPath = values.length;
                    if (!skipPathUpdate) {
                        t._selectPath.value = t._modPath;
                    }
                }
                return values;
            }
            t._inputFull.addEventListener('input', _ => {
                let values = checkForValidInput();
                let path = values[t._modPath];
                if (t._inputPath.value !== path) {
                    t._inputPath.value = path;
                }
                setPreview();
            });
            t._inputPath.addEventListener('input', _ => {
                let values = checkForValidInput();
                let value = values.join('\n');
                if (t._inputFull.value !== value) {
                    t._inputFull.value = value;
                }
                setPreview();
            });
            t._bottomGrid = webui.create('webui-grid', { gap: '1', theme: 'inherit', width: '100', height: '100' });
            t.appendChild(t._bottomGrid);
            t.loadIcons();
        },
        connected: (t) => {
            t.setupComponent();
        },
        loadFromDefinition: function (iconDef) {
            const t = this;
            if (!iconDef) return;
        },
        loadIcons: async function () {
            const t = this;
            try {
                let result = await fetch(`${srcRoot}all.json`);
                if (!result.ok) return;
                let icons = await result.json();
                let isFirst = true;
                icons.forEach(data => {
                    let icon = data.name;
                    let container = webui.create('a', { style: 'flex-direction:column;' });
                    t._bottomGrid.appendChild(container);
                    let el = webui.create('webui-icon', { icon: `${icon}|fill|shade:tri|theme:white`, width: '32' });
                    container.appendChild(el);
                    let label = webui.create('label', { text: icon });
                    container.appendChild(label);
                    container.addEventListener('click', _ => {
                        t._inputFull.value = el._definition;
                        t._inputFull.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                    });
                    if (isFirst) {
                        isFirst = false;
                        setTimeout(() => {
                            t._inputFull.value = el._definition;
                            t._inputFull.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                        }, 100);
                    }
                });
            } catch (ex) {
                console.error('Failed loading icons list', ex);
            }
        }
    });
}
