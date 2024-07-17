/* Display themed quote */
webui.define("webui-quote", {
    attr: ['cite', 'elevation'],
    connected: (t) => {
        let bc = document.createElement('blockquote');
        let r = [];
        t.parentNode.insertBefore(bc, t);
        t.childNodes.forEach(n => r.push(n));
        r.forEach(n => bc.appendChild(n));
        bc.classList.add('quote');
        if (t.theme) {
            bc.style.setProperty('--theme-color', `var(--color-${t.theme})`);
        }
        if (t.elevation >= 0) {
            bc.classList.add(`elevation-${t.elevation}`);
        } else if (t.elevation < 0) {
            bc.classList.add(`elevation-n${t.elevation * -1}`);
        }
        if (t.cite) {
            let c = document.createElement('cite');
            c.innerHTML = t.cite;
            bc.appendChild(c);
        }
        t.remove();
    }
});
