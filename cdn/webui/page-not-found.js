/* Display page not found content */
webui.define('webui-page-not-found', {
    connected: (t) => {
        if (!t.innerHTML) {
            t.innerHTML = `
<section class="paper elevation-10 side-by-side">
<section class="paper d-flex flex-column align-center justify-center readable-content" data-subscribe="not-found" data-set="innerHTML">
<p>The page you are looking for was not found!</p>
</section>
<section class="paper image d-flex flex-column align-center justify-center readable-content">
<img src="https://cdn.myfi.ws/v/Vecteezy/404-error-illustration-exclusive-design-inspiration.svg" />
</section>
</section>
`;
        }
    }
});
