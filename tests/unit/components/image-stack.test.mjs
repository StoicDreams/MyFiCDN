import { test, expect, mount } from '../support/webui.mjs';

const stack = (attrs = '') => `<webui-image-stack ${attrs}>
<img src="/a.png" alt="Render view">
<img src="/b.png" alt="Toolbox">
<img src="/c.png" alt="Sound mixer">
</webui-image-stack>`;
/** An image's place as `x,y,turn` (its inline transform; browsers drop a zero y). */
const transform = img => img.evaluate(el => {
    const m = el.style.transform.match(/translate\(([-\d.]+)px(?:,\s*([-\d.]+)px)?\)\s*rotate\(([-\d.]+)deg\)/);
    return m ? `${parseFloat(m[1])},${parseFloat(m[2] || '0')},${parseFloat(m[3])}` : el.style.transform;
});
const z = img => img.evaluate(el => Number(el.style.zIndex));

test('the first image is on top, and each one below is offset from the one above it', async ({ page }) => {
    const root = await mount(page, stack('offset-x="30" offset-y="20"'));
    const imgs = root.locator('webui-image-stack img');
    await expect(imgs.nth(0)).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => transform(imgs.nth(0))).toBe('0,0,0');
    await expect.poll(() => transform(imgs.nth(1))).toBe('30,20,0');
    await expect.poll(() => transform(imgs.nth(2))).toBe('60,40,0');
    expect(await z(imgs.nth(0))).toBeGreaterThan(await z(imgs.nth(1)));
    expect(await z(imgs.nth(1))).toBeGreaterThan(await z(imgs.nth(2)));
});
test('clicking an image brings it to the top, and the rest keep their order below it', async ({ page }) => {
    const root = await mount(page, stack('offset-x="10" offset-y="10"'));
    const imgs = root.locator('webui-image-stack img');
    await root.getByRole('button', { name: 'Bring to front: Sound mixer' }).click();
    await expect(imgs.nth(2)).toHaveAttribute('aria-pressed', 'true');
    await expect(imgs.nth(0)).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => transform(imgs.nth(2))).toBe('0,0,0');
    await expect.poll(() => transform(imgs.nth(0))).toBe('10,10,0');
    await expect.poll(() => transform(imgs.nth(1))).toBe('20,20,0');
    expect(await z(imgs.nth(2))).toBeGreaterThan(await z(imgs.nth(0)));
});
test('Enter and Space bring a focused image to the top', async ({ page }) => {
    const root = await mount(page, stack());
    const imgs = root.locator('webui-image-stack img');
    await imgs.nth(1).focus();
    await page.keyboard.press('Enter');
    await expect(imgs.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await imgs.nth(2).focus();
    await page.keyboard.press(' ');
    await expect(imgs.nth(2)).toHaveAttribute('aria-pressed', 'true');
    await expect(imgs.nth(1)).toHaveAttribute('aria-pressed', 'false');
});
test('the images are named buttons, the top one by its own name', async ({ page }) => {
    const root = await mount(page, stack());
    await expect(root.getByRole('button', { name: 'Render view', exact: true })).toHaveAttribute('tabindex', '0');
    await expect(root.getByRole('button', { name: 'Bring to front: Toolbox' })).toHaveCount(1);
    await expect(root.locator('webui-image-stack')).toHaveAttribute('role', 'group');
});
test('without the rotate flag no image turns', async ({ page }) => {
    const root = await mount(page, stack());
    const imgs = root.locator('webui-image-stack img');
    await expect.poll(() => transform(imgs.nth(1))).toMatch(/,0$/);
    await expect.poll(() => transform(imgs.nth(2))).toMatch(/,0$/);
    await expect(imgs.nth(1)).not.toHaveAttribute('data-rotation', /.*/);
});
test('with rotate, images below the top keep their own rotation, and the top one is straight', async ({ page }) => {
    const root = await mount(page, stack('rotate max-rotation="9"'));
    const imgs = root.locator('webui-image-stack img');
    await expect(imgs.nth(1)).toHaveAttribute('data-rotation', /^-?\d/);
    const turnOf = async img => parseFloat(await img.getAttribute('data-rotation'));
    const b = await turnOf(imgs.nth(1));
    const c = await turnOf(imgs.nth(2));
    for (const r of [b, c]) {
        expect(Math.abs(r)).toBeGreaterThanOrEqual(3);
        expect(Math.abs(r)).toBeLessThanOrEqual(9);
    }
    await expect.poll(() => transform(imgs.nth(0))).toMatch(/,0$/);
    await expect.poll(() => transform(imgs.nth(1))).toBe(`24,24,${b}`);
    // On top, its rotation isn't used; below again, the same rotation comes back.
    await imgs.nth(1).click();
    await expect.poll(() => transform(imgs.nth(1))).toMatch(/,0$/);
    await imgs.nth(2).click();
    await expect.poll(() => transform(imgs.nth(1))).toBe(`24,24,${b}`);
    expect(await turnOf(imgs.nth(1))).toBe(b);
});
test('an image can set its own rotation', async ({ page }) => {
    const root = await mount(page, `<webui-image-stack rotate><img src="/a.png" alt="A"><img src="/b.png" alt="B" data-rotation="-4.5"></webui-image-stack>`);
    await expect.poll(() => transform(root.locator('img').nth(1))).toBe('24,24,-4.5');
});
test('the transition defaults to 500ms and follows the attribute', async ({ page }) => {
    const root = await mount(page, `${stack()}<webui-image-stack id="slow" transition="900"><img src="/a.png" alt="A"></webui-image-stack>`);
    await expect.poll(() => root.locator('webui-image-stack').first().evaluate(el => el.style.getPropertyValue('--image-stack-transition'))).toBe('500ms');
    await expect.poll(() => root.locator('#slow').evaluate(el => el.style.getPropertyValue('--image-stack-transition'))).toBe('900ms');
});
test('leaves room for the deepest offset', async ({ page }) => {
    const root = await mount(page, stack('offset-x="12" offset-y="-8"'));
    const el = root.locator('webui-image-stack');
    await expect.poll(() => el.evaluate(e => e.style.getPropertyValue('--image-stack-pad-x'))).toBe('24px');
    await expect.poll(() => el.evaluate(e => e.style.getPropertyValue('--image-stack-pad-top'))).toBe('16px');
    await expect.poll(() => el.evaluate(e => e.style.getPropertyValue('--image-stack-pad-y'))).toBe('0px');
});
test('an image added later joins at the bottom', async ({ page }) => {
    const root = await mount(page, `<webui-image-stack offset-x="5" offset-y="5"><img src="/a.png" alt="A"></webui-image-stack>`);
    await root.locator('webui-image-stack').evaluate(el => {
        const img = document.createElement('img');
        img.src = '/b.png';
        img.alt = 'B';
        el.appendChild(img);
    });
    await expect.poll(() => transform(root.locator('img').nth(1))).toBe('5,5,0');
    await root.getByRole('button', { name: 'Bring to front: B' }).click();
    await expect(root.locator('img').nth(1)).toHaveAttribute('aria-pressed', 'true');
});
test('bringing an image to the top fires change', async ({ page }) => {
    const root = await mount(page, stack());
    await root.locator('webui-image-stack').evaluate(el => el.addEventListener('change', ev => { window.__stackTop = ev.detail.image.alt; }));
    await root.getByRole('button', { name: 'Bring to front: Toolbox' }).click();
    await expect.poll(() => page.evaluate(() => window.__stackTop)).toBe('Toolbox');
});
