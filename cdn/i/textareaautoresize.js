(function SetupTextareaAutoResize() {
    'use strict';
    // This process allows textarea inputs to accept Shift+Tab input to enter Tab character.
    document.body.addEventListener("keydown", (ev) => {
        if (ev.key !== 'Tab' || !ev.shiftKey) { return; }
        if (!ev.target || ev.target.nodeName !== 'TEXTAREA') { return; }
        ev.preventDefault();
        let el = ev.target;
        let text = el.value;
        let postTab = text.slice(el.selectionEnd, text.length);
        let cursorPos = el.selectionEnd;
        if (ev.shiftKey) {
            let trimCount = 0;
            for (let i = 0; i < 4; ++i) {
                if (text.charAt(cursorPos - 1) === '\t') {
                    if (i > 0) { break; }
                    --cursorPos;
                    ++trimCount;
                    break;
                }
                if (text.charAt(cursorPos - 1) === ' ') {
                    --cursorPos;
                    ++trimCount;
                    continue;
                }
                break;
            }
            if (trimCount > 0) {
                ev.target.value = text.slice(0, el.selectionStart - trimCount) + postTab;
            }
        } else {
            ev.target.value = text.slice(0, el.selectionStart) + "\t" + postTab;
            ++cursorPos;
        }
        el.selectionStart = cursorPos;
        el.selectionEnd = cursorPos;
    });
    function autosizeTextArea(target) {
        if (target.nodeName !== 'TEXTAREA') { return; }
        setTimeout(() => {
            target.style.height = `0px`;
            let newHeight = target.scrollHeight;
            target.style.height = `${(newHeight)}px`;
        }, 10);
    }
    function UpdateAllDisplayedTextareaSizes() {
        document.querySelectorAll('textarea').forEach(instance => {
            autosizeTextArea(instance);
        });
    }
    // Publicly available helper methods
    window.AutosizeTextarea = autosizeTextArea;
    window.RefreshTextareaSizes = () => {
        // Add slight delay to allow time for DOM rendering to complete
        setTimeout(UpdateAllDisplayedTextareaSizes, 100);
    }
    // Listen for updates from textarea inputs
    /*
    ['input', 'focusin', 'change'].forEach(eventKey => {
        document.body.addEventListener(eventKey, ev => {
            if (!ev.target || ev.target.nodeName !== 'TEXTAREA') { return; }
            autosizeTextArea(ev.target);
        });
    });
    */
    // Process updates if the window is resized
    window.addEventListener('resize', UpdateAllDisplayedTextareaSizes);
    // Observe for DOM updates to set sizing as textarea elements are attached to DOM.
    const startObserving = (domNode) => {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(function (mutation) {
                if (mutation.target && mutation.target.parentNode && mutation.target.parentNode.nodeName === 'TEXTAREA') {
                    autosizeTextArea(mutation.target.parentNode);
                }
                Array.from(mutation.addedNodes).forEach(el => {
                    if (!el.nodeName || el.nodeName !== 'TEXTAREA') return;
                    autosizeTextArea(el);
                });
            });
        });
        observer.observe(domNode, {
            childList: true,
            attributes: true,
            characterData: true,
            subtree: true,
        });
        return observer;
    };
    startObserving(document.body);
})();
