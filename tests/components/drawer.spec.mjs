import { test, expect, mount } from '../support/webui.mjs';

test('assigns an id and shows dock and move controls', async ({ page }) => {
    const root = await mount(page, '<webui-drawer slot="left" data-dockable data-moveable docked="true"></webui-drawer>');
    const drawer = root.locator('webui-drawer');
    await expect(drawer).toHaveAttribute('id', /^d[0-9a-f]+$/);
    await expect(drawer.locator('[slot="footer"] .toggle-pos-right')).toHaveCount(1);
    await expect(drawer.locator('[slot="footer"] webui-toggle-icon')).toHaveCount(1);
});
test('move buttons change the slot', async ({ page }) => {
    const root = await mount(page, '<webui-drawer slot="left" data-moveable></webui-drawer>');
    const drawer = root.locator('webui-drawer');
    await expect(drawer).toHaveAttribute('id', /./);
    await drawer.locator('.toggle-pos-right').evaluate(el => el.click());
    await expect(drawer).toHaveAttribute('slot', 'right');
});
test('the footer is rebuilt when content replaces it', async ({ page }) => {
    const root = await mount(page, '<webui-drawer data-moveable></webui-drawer>');
    const drawer = root.locator('webui-drawer');
    await expect(drawer.locator('[slot="footer"]')).toHaveCount(1);
    await drawer.evaluate(el => { el.innerHTML = '<p>New</p>'; });
    await expect(drawer.locator('p')).toHaveText('New');
    await expect(drawer.locator('[slot="footer"]')).toHaveCount(1);
});
test('narrow windows undock it, and wide windows restore it', async ({ page }) => {
    const root = await mount(page, '<webui-drawer data-dockable docked="true"></webui-drawer>');
    const drawer = root.locator('webui-drawer');
    await expect(drawer).toHaveAttribute('docked', 'true');
    await page.setViewportSize({ width: 600, height: 700 });
    await expect(drawer).not.toHaveAttribute('docked');
    await expect(drawer.locator('[slot="footer"] webui-toggle-icon')).toHaveCount(0);
    await page.setViewportSize({ width: 1300, height: 700 });
    await expect(drawer).toHaveAttribute('docked', 'true');
});
test('the open class slides an undocked drawer into view', async ({ page }) => {
    const root = await mount(page, '<webui-drawer style="transition:none">Body</webui-drawer>');
    const drawer = root.locator('webui-drawer');
    await expect(drawer).not.toBeInViewport();
    await drawer.evaluate(el => el.classList.add('open'));
    await expect(drawer).toBeInViewport();
});
test('is a labelled landmark, named Menu when it holds the site menu', async ({ page }) => {
    const root = await mount(page, '<webui-drawer id="menu" slot="left" class="nav"><webui-nav></webui-nav></webui-drawer><webui-drawer id="panel" slot="right" class="shared"></webui-drawer>');
    await expect(root.getByRole('complementary', { name: 'Menu' })).toBeAttached();
    await expect(root.getByRole('complementary', { name: 'Side panel' })).toBeAttached();
});
test('dock and move controls name the menu navigation, and any other drawer a panel', async ({ page }) => {
    const root = await mount(page, '<webui-drawer slot="left" class="nav" data-dockable data-moveable docked="true"><webui-nav></webui-nav></webui-drawer><webui-drawer slot="right" class="shared" data-dockable data-moveable docked="true"></webui-drawer>');
    // The drawer replaces any id with its own, so these are found by class.
    const menu = root.locator('webui-drawer.nav > [slot="footer"]');
    const panel = root.locator('webui-drawer.shared > [slot="footer"]');
    await expect(menu.locator('webui-toggle-icon')).toHaveAttribute('title-on', 'Hide Navigation');
    await expect(menu.locator('webui-toggle-icon')).toHaveAttribute('title-off', 'Dock Navigation');
    await expect(menu.locator('.toggle-pos-right')).toHaveAttribute('aria-label', 'Set navigation to right');
    await expect(panel.locator('webui-toggle-icon')).toHaveAttribute('title-on', 'Hide Panel');
    await expect(panel.locator('webui-toggle-icon')).toHaveAttribute('title-off', 'Dock Panel');
    await expect(panel.locator('.toggle-pos-left')).toHaveAttribute('aria-label', 'Set panel to left');
});
test.describe('close button', () => {
    test('closes an open drawer', async ({ page }) => {
        const root = await mount(page, '<webui-drawer slot="right" class="shared open" data-dockable>Body</webui-drawer>');
        const drawer = root.locator('webui-drawer');
        const close = drawer.locator('[slot="footer"] .drawer-close');
        await expect(close).toHaveAttribute('title', 'Close Panel');
        await close.click();
        await expect(drawer).not.toHaveClass(/open/);
    });
    test('undocks and closes a docked drawer', async ({ page }) => {
        await page.setViewportSize({ width: 1300, height: 700 });
        const root = await mount(page, '<webui-drawer slot="right" class="shared open" data-dockable docked="true">Body</webui-drawer>');
        const drawer = root.locator('webui-drawer');
        await drawer.locator('[slot="footer"] .drawer-close').click();
        await expect(drawer).not.toHaveAttribute('docked');
        await expect(drawer).not.toHaveClass(/open/);
    });
    test('shows on a narrow window too, where the dock button does not', async ({ page }) => {
        await page.setViewportSize({ width: 600, height: 700 });
        const root = await mount(page, '<webui-drawer slot="left" class="nav" data-dockable><webui-nav></webui-nav></webui-drawer>');
        const footer = root.locator('webui-drawer > [slot="footer"]');
        await expect(footer.locator('.drawer-close')).toHaveAttribute('title', 'Close Navigation');
        await expect(footer.locator('webui-toggle-icon')).toHaveCount(0);
    });
});
test.describe('resizing', () => {
    test.beforeEach(async ({ page }) => page.setViewportSize({ width: 1300, height: 700 }));
    const handle = drawer => drawer.locator('.resize');
    const drag = async (page, drawer, dx) => {
        const box = await handle(drawer).boundingBox();
        const x = box.x + box.width / 2, y = box.y + box.height / 2;
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x + dx / 2, y);
        await page.mouse.move(x + dx, y);
        await page.mouse.up();
    };
    const width = drawer => drawer.evaluate(el => Math.round(el.getBoundingClientRect().width));
    const mountRight = async (page, attrs = '') => (await mount(page, `<webui-drawer slot="right" class="shared" data-dockable resizable docked="true" ${attrs} style="height:300px">Body</webui-drawer>`)).locator('webui-drawer');

    test('dragging the inner edge of a right drawer makes it wider, and the width is kept', async ({ page }) => {
        const drawer = await mountRight(page, 'width="300"');
        await expect.poll(() => width(drawer)).toBe(300);
        await drag(page, drawer, -100);
        await expect.poll(() => width(drawer)).toBe(400);
        await expect(drawer).toHaveAttribute('width', '400');
    });
    test('a left drawer is dragged from its right edge', async ({ page }) => {
        const drawer = (await mount(page, '<webui-drawer slot="left" class="nav" resizable docked="true" width="300" style="height:300px"><webui-nav></webui-nav></webui-drawer>')).locator('webui-drawer');
        await expect.poll(() => width(drawer)).toBe(300);
        await drag(page, drawer, 50);
        await expect.poll(() => width(drawer)).toBe(350);
        await expect(handle(drawer)).toHaveAttribute('aria-label', 'Resize Navigation');
    });
    test('it cannot be made narrower than the minimum, or wider than 90% of the window', async ({ page }) => {
        const drawer = await mountRight(page, 'width="300"');
        await drag(page, drawer, 1000);
        await expect(drawer).toHaveAttribute('width', '240');
        await drag(page, drawer, -2000);
        await expect(drawer).toHaveAttribute('width', '1170');
        await expect.poll(() => width(drawer)).toBe(1170);
    });
    test('a saved width wider than a smaller window is kept within 90% of it', async ({ page }) => {
        const drawer = await mountRight(page, 'width="1100"');
        await page.setViewportSize({ width: 1000, height: 700 });
        await expect.poll(() => width(drawer)).toBe(900);
        await expect(drawer).toHaveAttribute('width', '1100');
    });
    test('resizes while undocked too', async ({ page }) => {
        const drawer = (await mount(page, '<webui-drawer slot="right" class="shared open" resizable width="300">Body</webui-drawer>')).locator('webui-drawer');
        await expect.poll(() => width(drawer)).toBe(300);
        await drag(page, drawer, -60);
        await expect.poll(() => width(drawer)).toBe(360);
    });
    test('arrow keys resize it, and a double click resets it', async ({ page }) => {
        const drawer = await mountRight(page, 'width="300"');
        await expect(handle(drawer)).toHaveAttribute('aria-label', 'Resize Panel');
        await handle(drawer).focus();
        await page.keyboard.press('ArrowLeft');
        await expect(drawer).toHaveAttribute('width', '332');
        await page.keyboard.press('ArrowRight');
        await expect(drawer).toHaveAttribute('width', '300');
        await handle(drawer).dblclick();
        await expect(drawer).not.toHaveAttribute('width');
        expect(await drawer.evaluate(el => el.style.width)).toBe('');
    });
    test('docked and undocked limits can each be set, in pixels or as a share of the window', async ({ page }) => {
        const drawer = await mountRight(page, 'width="300" docked-min-width="350" docked-max-width="500px" undocked-min-width="10%" undocked-max-width="40vw"');
        // Docked, 300 is below the docked minimum of 350.
        await expect.poll(() => width(drawer)).toBe(350);
        await drag(page, drawer, -1000);
        await expect(drawer).toHaveAttribute('width', '500');
        // Undocked, the limits are 130 to 520 on this 1300px window, so 500 fits.
        await drawer.evaluate(el => { el.removeAttribute('docked'); el.classList.add('open'); });
        await expect.poll(() => width(drawer)).toBe(500);
        await drag(page, drawer, 1000);
        await expect(drawer).toHaveAttribute('width', '130');
        // Docking again holds it to the docked minimum, while the saved width stays as dragged.
        await drawer.evaluate(el => el.setAttribute('docked', 'true'));
        await expect.poll(() => width(drawer)).toBe(350);
        await expect(drawer).toHaveAttribute('width', '130');
    });
    test('without a saved width, the content sets the width within the limits', async ({ page }) => {
        // In a row, as in the app's layout, so the drawer is as wide as its content rather than the page.
        const root = await mount(page, '<div style="display:flex;justify-content:flex-end"><webui-drawer slot="right" class="shared" resizable docked="true" docked-min-width="400" style="height:300px">Body</webui-drawer></div>');
        const drawer = root.locator('webui-drawer');
        await expect.poll(() => width(drawer)).toBe(400);
        await drawer.evaluate(el => el.setAttribute('docked-min-width', '260'));
        await expect.poll(() => width(drawer)).toBe(260);
    });
    test('the maximum wins over a larger minimum, and neither goes past the window', async ({ page }) => {
        const drawer = await mountRight(page, 'width="300" docked-min-width="700" docked-max-width="500"');
        await expect.poll(() => width(drawer)).toBe(500);
        await drawer.evaluate(el => { el.setAttribute('docked-min-width', '200'); el.setAttribute('docked-max-width', '5000'); });
        await drag(page, drawer, -3000);
        await expect(drawer).toHaveAttribute('width', '1300');
    });
    test('an invalid limit falls back to the default', async ({ page }) => {
        const drawer = await mountRight(page, 'width="100" docked-min-width="wide"');
        await expect.poll(() => width(drawer)).toBe(240);
    });
    test('a drawer that is not resizable keeps the sizes in its own style', async ({ page }) => {
        const drawer = (await mount(page, '<webui-drawer slot="left" class="nav" style="min-width:24ch;max-width:400px" docked-min-width="300">Nav</webui-drawer>')).locator('webui-drawer');
        await drawer.evaluate(el => el.setAttribute('width', '350'));
        expect(await drawer.evaluate(el => [el.style.minWidth, el.style.maxWidth, el.style.width])).toEqual(['24ch', '400px', '']);
        // Turning resizing on and off again leaves only what the page set.
        await drawer.evaluate(el => el.setAttribute('resizable', ''));
        await expect.poll(() => drawer.evaluate(el => el.style.width)).toBe('350px');
        await drawer.evaluate(el => el.removeAttribute('resizable'));
        await expect.poll(() => drawer.evaluate(el => el.style.width)).toBe('');
        expect(await drawer.evaluate(el => el.style.maxWidth)).toBe('');
    });
    test('only drawers marked resizable, on the left or right, can be resized', async ({ page }) => {
        const root = await mount(page, '<webui-drawer slot="right" class="a" width="400">A</webui-drawer><webui-drawer slot="top" class="b" resizable width="400">B</webui-drawer>');
        await expect(root.locator('webui-drawer.a .resize')).toBeHidden();
        await expect(root.locator('webui-drawer.b .resize')).toBeHidden();
        expect(await root.locator('webui-drawer.a').evaluate(el => el.style.width)).toBe('');
    });
    test('moving a drawer to the top drops its width, and back to the side restores it', async ({ page }) => {
        const drawer = await mountRight(page, 'width="320"');
        await expect.poll(() => drawer.evaluate(el => el.style.width)).toBe('320px');
        await drawer.evaluate(el => el.setAttribute('slot', 'top'));
        await expect.poll(() => drawer.evaluate(el => el.style.width)).toBe('');
        await drawer.evaluate(el => el.setAttribute('slot', 'left'));
        await expect.poll(() => drawer.evaluate(el => el.style.width)).toBe('320px');
    });
});
