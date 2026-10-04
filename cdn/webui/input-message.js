/*!
 * Web UI Input Message - https://webui.stoicdreams.com/components#webui-input-message
 * A component for displaying and managing multi-line text input fields.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2024-2025 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict";
{
  function handleKeyDown(ev) {
    if (ev.key !== "Tab" || !ev.shiftKey) {
      return;
    }
    if (!ev.target || ev.target.nodeName !== "TEXTAREA") {
      return;
    }
    ev.preventDefault();
    let el = ev.target;
    let text = el.value;
    let postTab = text.slice(el.selectionEnd, text.length);
    let cursorPos = el.selectionEnd;
    let tab = el.getAttribute("tab") || "\t";
    ev.target.value = text.slice(0, el.selectionStart) + tab + postTab;
    cursorPos += tab.length;
    el.selectionStart = cursorPos;
    el.selectionEnd = cursorPos;
    el.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  }
  webui.define("webui-input-message", {
    constructor() {
      const t = this;
      t.addEventListener("click", () => t._field.focus());
      t.addEventListener("focus", () => t._field.focus());
      t._label = t.template.querySelector("label");
      t._field = t.template.querySelector("textarea");
      t._wrap = t.template.querySelector(".grow-wrap");
      t._field.setAttribute("name", "message");
      t._field.addEventListener("keydown", handleKeyDown);
      t._field.addEventListener("input", () => {
        if (t.sanitize) {
          const value = webui.sanitize(t._field.value);
          if (value !== t._field.value) {
            t._field.value = value;
          }
        }
        t._wrap.dataset.replicatedValue = t._field.value;
      });
    },
    flags: ['sanitize'],
    attr: [
      "title",
      "name",
      "autofocus",
      "value",
      "label",
      "placeholder",
      "tab",
      "height",
      "max-height"
    ],
    attrChanged(property, value) {
      const t = this;
      switch (property) {
        case "height":
          t.style.height = webui.pxIfNumber(value);
          break;
        case "maxHeight":
          t.style.maxHeight = webui.pxIfNumber(value);
          break;
        case "placeholder":
          t._field.setAttribute("placeholder", value);
          break;
        case "label":
          t._label.innerHTML = value;
          break;
        case "name":
          t._field.setAttribute("name", value);
          break;
        case "autofocus":
          t._field.setAttribute("autofocus", value);
          break;
        case "value":
          t.setValue(value);
          break;
        case "tab":
          t._field.setAttribute("tab", value || "  ");
          break;
      }
    },
    props: {
      value: {
        get() {
          return webui.getDefined(this._field.value, "");
        },
        set(v) {
          this.setValue(webui.getDefined(v, ""));
        },
      },
    },
    setValue(value) {
      const t = this;
      if (t._field.value === value) return;
      t._field.value = value;
      t._wrap.dataset.replicatedValue = value;
    },
    connected() {
      const t = this;
      let id = webui.uuid();
      t._label.setAttribute("for", id);
      t._field.setAttribute("id", id);
    },
    shadowTemplate: `
<style type="text/css">
:host {
    display: block;
    position: relative;
    box-sizing: border-box;
    border: var(--theme-border-width) solid var(--theme-color);
    background-color: #ecddcbff;
    color: #black;
}
label {
    display: block;
    padding: var(--padding);
    margin: 0;
    background-color: var(--theme-color);
    color: var(--theme-color-offset);
}
label:empty {
    display: none;
}
.grow-wrap {
    display: grid;
    min-height: 3em;
}
.grow-wrap::after {
    content: attr(data-replicated-value) " ";
    white-space: pre-wrap;
    visibility: hidden;
    word-wrap: break-word;
}
textarea, .grow-wrap::after {
    grid-area: 1 / 1 / 2 / 2;
    padding: var(--padding);
    font: inherit;
    box-sizing: border-box;
    width: 100%;
    margin: 0;
    border: none;
}
textarea {
    resize: none;
    outline: none;
    background: transparent;
    overflow: hidden;
}
</style>
<label></label>
<div class="grow-wrap">
    <textarea spellcheck="true" autocomplete="off" autocorrect="off"></textarea>
</div>
`,
  });
}
