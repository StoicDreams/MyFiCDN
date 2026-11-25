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
test('with no slots listed it offers all four, and a list such as left|right offers only those', async ({ page }) => {
    const root = await mount(page, '<webui-drawer class="all" slot="left" data-moveable></webui-drawer><webui-drawer class="sides" slot="left" data-moveable="left|right"></webui-drawer>');
    // A drawer gives itself its own id, so these are found by class.
    const buttons = name => root.locator(`webui-drawer.${name} [slot="footer"] button[data-setattr]`);
    await expect.poll(() => buttons('all').evaluateAll(list => list.map(b => b.className))).toEqual(['toggle-pos-left', 'toggle-pos-right', 'toggle-pos-top', 'toggle-pos-bottom']);
    await expect.poll(() => buttons('sides').evaluateAll(list => list.map(b => b.className))).toEqual(['toggle-pos-left', 'toggle-pos-right']);
});
test('a drawer limited to some slots moves out of one it may not use, such as a saved top', async ({ page }) => {
    const root = await mount(page, '<webui-drawer class="d" slot="top" data-moveable="left|right"></webui-drawer>');
    const drawer = root.locator('webui-drawer.d');
    await expect(drawer).toHaveAttribute('slot', 'left');
    await drawer.evaluate(el => el.setAttribute('slot', 'bottom'));
    await expect(drawer).toHaveAttribute('slot', 'left');
    await drawer.evaluate(el => el.setAttribute('slot', 'right'));
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
test('a drawer undocked by a narrow window is kept docked, so it docks again after a reload while narrow', async ({ page }) => {
    const root = await mount(page, '<webui-drawer class="kept" data-dockable data-state="docked" docked="true"></webui-drawer>');
    await expect(root.locator('webui-drawer.kept')).toHaveAttribute('docked', 'true');
    await page.setViewportSize({ width: 600, height: 700 });
    await expect(root.locator('webui-drawer.kept')).not.toHaveAttribute('docked');
    // The page reloads while the window is narrow: a new drawer takes the saved state.
    await root.evaluate(el => {
        el.querySelector('webui-drawer.kept').remove();
        el.insertAdjacentHTML('beforeend', '<webui-drawer class="kept again" data-dockable data-state="docked"></webui-drawer>');
    });
    const again = root.locator('webui-drawer.again');
    await expect(again).toHaveAttribute('id', /./);
    await expect(again).not.toHaveAttribute('docked');
    await page.setViewportSize({ width: 1300, height: 700 });
    await expect(again).toHaveAttribute('docked', 'true');
});
test('a drawer docked while the window is narrow, as its saved state can be as the app starts, docks once the window widens', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 700 });
    const root = await mount(page, '<webui-drawer class="late" data-dockable data-state="docked"></webui-drawer>');
    const drawer = root.locator('webui-drawer.late');
    await expect(drawer).toHaveAttribute('id', /./);
    await drawer.evaluate(el => el.setAttribute('docked', 'true'));
    // Still narrow, it stays undocked until the window widens.
    await page.setViewportSize({ width: 650, height: 700 });
    await expect(drawer).not.toHaveAttribute('docked');
    await page.setViewportSize({ width: 1300, height: 700 });
    await expect(drawer).toHaveAttribute('docked', 'true');
});
test('the docking is checked again when the window gets focus, and a window with no width is not narrow', async ({ page }) => {
    const root = await mount(page, '<webui-drawer data-dockable docked="true"></webui-drawer>');
    const drawer = root.locator('webui-drawer');
    await expect(drawer).toHaveAttribute('id', /./);
    // The window's width changes with no resize reaching the page, as after the screen was locked.
    const widthOnFocus = width => page.evaluate(width => {
        Object.defineProperty(window, 'innerWidth', { configurable: true, get: () => width });
        window.dispatchEvent(new Event('focus'));
    }, width);
    await widthOnFocus(0);
    await expect(drawer).toHaveAttribute('docked', 'true');
    await widthOnFocus(600);
    await expect(drawer).not.toHaveAttribute('docked');
    await widthOnFocus(1300);
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
    test('a docked drawer closed with it comes back docked when it opens next', async ({ page }) => {
        await page.setViewportSize({ width: 1300, height: 700 });
        const root = await mount(page, '<webui-drawer slot="right" class="shared open" data-dockable docked="true">Body</webui-drawer>');
        const drawer = root.locator('webui-drawer');
        const dock = drawer.locator('[slot="footer"] webui-toggle-icon');
        await expect(dock).toHaveAttribute('enabled');
        await drawer.locator('[slot="footer"] .drawer-close').click();
        await expect(drawer).not.toHaveAttribute('docked');
        await drawer.evaluate(el => el.classList.add('open'));
        await expect(drawer).toHaveAttribute('docked');
        await expect(dock).toHaveAttribute('enabled');
        // Undocked with its dock button, it stays undocked when it opens again.
        await dock.click();
        await expect(drawer).not.toHaveAttribute('docked');
        await drawer.evaluate(el => { el.classList.remove('open'); el.classList.add('open'); });
        await expect(drawer).not.toHaveAttribute('docked');
    });
    test('a docked drawer closed with it is kept to dock again over a reload', async ({ page }) => {
        await page.setViewportSize({ width: 1300, height: 700 });
        const root = await mount(page, '<webui-drawer class="redock" slot="right" data-dockable data-state="docked|dock-on-open" docked="true">Body</webui-drawer>');
        await root.locator('webui-drawer.redock [slot="footer"] .drawer-close').click();
        await expect(root.locator('webui-drawer.redock')).not.toHaveAttribute('docked');
        // The same drawer drawn again, as after a reload, starts closed, and docks when it opens.
        await root.evaluate(el => {
            el.querySelector('webui-drawer.redock').remove();
            el.insertAdjacentHTML('beforeend', '<webui-drawer class="redock again" slot="right" data-dockable data-state="docked|dock-on-open">Body</webui-drawer>');
        });
        const again = root.locator('webui-drawer.again');
        await expect(again).toHaveAttribute('dock-on-open', 'true');
        await expect(again).not.toHaveAttribute('docked');
        await again.evaluate(el => el.classList.add('open'));
        await expect(again).toHaveAttribute('docked');
    });
    test('a drawer closed while docked on a narrow window docks when the window widens', async ({ page }) => {
        await page.setViewportSize({ width: 1300, height: 700 });
        const root = await mount(page, '<webui-drawer slot="right" class="shared open" data-dockable docked="true">Body</webui-drawer>');
        const drawer = root.locator('webui-drawer');
        await drawer.locator('[slot="footer"] .drawer-close').click();
        await page.setViewportSize({ width: 600, height: 700 });
        await drawer.evaluate(el => el.classList.add('open'));
        await expect(drawer).not.toHaveAttribute('docked');
        await page.setViewportSize({ width: 1300, height: 700 });
        await expect(drawer).toHaveAttribute('docked');
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
    // Each resize is recorded in the drawer's width attribute, which is saved, and the drawer applies that width within
    // its limits as its own width, min-width, and max-width. Those are its state; how wide it looks is checked by eye.
    const applied = drawer => drawer.evaluate(el => el.style.width);
    const appliedMin = drawer => drawer.evaluate(el => el.style.minWidth);
    const mountRight = async (page, attrs = '') => (await mount(page, `<webui-drawer slot="right" class="shared" data-dockable resizable docked="true" ${attrs} style="height:300px">Body</webui-drawer>`)).locator('webui-drawer');

    test('the handle sits beside the content, so a click at the start of the content reaches it', async ({ page }) => {
        for (const slot of ['right', 'left']) {
            const root = await mount(page, `<webui-drawer slot="${slot}" resizable docked="true" width="300" style="height:300px"><div class="body" style="height:100%">Body</div></webui-drawer>`);
            const body = root.locator('webui-drawer .body');
            await expect(handle(root.locator('webui-drawer'))).toBeAttached();
            // What a click lands on at the content's inner edge, the side the handle is on.
            const hit = await body.evaluate((el, slot) => {
                const box = el.getBoundingClientRect();
                const x = slot === 'right' ? box.left + 1 : box.right - 1;
                return document.elementFromPoint(x, box.top + box.height / 2)?.className;
            }, slot);
            expect(hit, `${slot} drawer`).toBe('body');
        }
    });
    test('dragging the inner edge of a right drawer makes it wider, and the width is kept', async ({ page }) => {
        const drawer = await mountRight(page, 'width="300"');
        await drag(page, drawer, -100);
        await expect(drawer).toHaveAttribute('width', '400');
    });
    test('a left drawer is dragged from its right edge', async ({ page }) => {
        const drawer = (await mount(page, '<webui-drawer slot="left" class="nav" resizable docked="true" width="300" style="height:300px"><webui-nav></webui-nav></webui-drawer>')).locator('webui-drawer');
        await drag(page, drawer, 50);
        await expect(drawer).toHaveAttribute('width', '350');
        await expect(handle(drawer)).toHaveAttribute('aria-label', 'Resize Navigation');
    });
    test('it cannot be made narrower than the minimum, or wider than 90% of the window', async ({ page }) => {
        const drawer = await mountRight(page, 'width="300"');
        await drag(page, drawer, 1000);
        await expect(drawer).toHaveAttribute('width', '240');
        await drag(page, drawer, -2000);
        await expect(drawer).toHaveAttribute('width', '1170');
    });
    test('a saved width wider than a smaller window is kept within 90% of it', async ({ page }) => {
        const drawer = await mountRight(page, 'width="1100"');
        await page.setViewportSize({ width: 1000, height: 700 });
        // It still shows whole inside the window, and keeps its saved width for when the window grows again.
        await expect(drawer).toBeInViewport({ ratio: 0.99 });
        await expect(drawer).toHaveAttribute('width', '1100');
    });
    test('resizes while undocked too', async ({ page }) => {
        const drawer = (await mount(page, '<webui-drawer slot="right" class="shared open" resizable width="300">Body</webui-drawer>')).locator('webui-drawer');
        await drag(page, drawer, -60);
        await expect(drawer).toHaveAttribute('width', '360');
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
        await expect.poll(() => drawer.evaluate(el => el.style.width)).toBe('');
    });
    test('docked and undocked limits can each be set, in pixels or as a share of the window', async ({ page }) => {
        const drawer = await mountRight(page, 'width="300" docked-min-width="350" docked-max-width="500px" undocked-min-width="10%" undocked-max-width="40vw"');
        // Docked, 300 is below the docked minimum of 350.
        await expect.poll(() => applied(drawer)).toBe('350px');
        await drag(page, drawer, -1000);
        await expect(drawer).toHaveAttribute('width', '500');
        // Undocked, the limits are 130 to 520 on this 1300px window, so 500 fits.
        await drawer.evaluate(el => { el.removeAttribute('docked'); el.classList.add('open'); });
        await expect.poll(() => applied(drawer)).toBe('500px');
        await drag(page, drawer, 1000);
        await expect(drawer).toHaveAttribute('width', '130');
        // Docking again holds it to the docked minimum, while the saved width stays as dragged.
        await drawer.evaluate(el => el.setAttribute('docked', 'true'));
        await expect.poll(() => applied(drawer)).toBe('350px');
        await expect(drawer).toHaveAttribute('width', '130');
    });
    test('without a saved width, the content sets the width within the limits', async ({ page }) => {
        // In a row, as in the app's layout, so the drawer is as wide as its content rather than the page.
        const root = await mount(page, '<div style="display:flex;justify-content:flex-end"><webui-drawer slot="right" class="shared" resizable docked="true" docked-min-width="400" style="height:300px">Body</webui-drawer></div>');
        const drawer = root.locator('webui-drawer');
        // No width of its own, only the limits it keeps the content within.
        await expect.poll(() => appliedMin(drawer)).toBe('400px');
        await expect.poll(() => applied(drawer)).toBe('');
        await drawer.evaluate(el => el.setAttribute('docked-min-width', '260'));
        await expect.poll(() => appliedMin(drawer)).toBe('260px');
    });
    test('the maximum wins over a larger minimum, and neither goes past the window', async ({ page }) => {
        const drawer = await mountRight(page, 'width="300" docked-min-width="700" docked-max-width="500"');
        await expect.poll(() => applied(drawer)).toBe('500px');
        await drawer.evaluate(el => { el.setAttribute('docked-min-width', '200'); el.setAttribute('docked-max-width', '5000'); });
        await drag(page, drawer, -3000);
        await expect(drawer).toHaveAttribute('width', '1300');
    });
    test('an invalid limit falls back to the default', async ({ page }) => {
        const drawer = await mountRight(page, 'width="100" docked-min-width="wide"');
        await expect.poll(() => applied(drawer)).toBe('240px');
    });
    test('a drawer that is not resizable keeps the sizes in its own style', async ({ page }) => {
        const drawer = (await mount(page, '<webui-drawer slot="left" class="nav" style="min-width:24ch;max-width:400px" docked-min-width="300">Nav</webui-drawer>')).locator('webui-drawer');
        await drawer.evaluate(el => el.setAttribute('width', '350'));
        await expect.poll(() => drawer.evaluate(el => [el.style.minWidth, el.style.maxWidth, el.style.width])).toEqual(['24ch', '400px', '']);
        // Turning resizing on and off again leaves only what the page set.
        await drawer.evaluate(el => el.setAttribute('resizable', ''));
        await expect.poll(() => drawer.evaluate(el => el.style.width)).toBe('350px');
        await drawer.evaluate(el => el.removeAttribute('resizable'));
        await expect.poll(() => drawer.evaluate(el => el.style.width)).toBe('');
        await expect.poll(() => drawer.evaluate(el => el.style.maxWidth)).toBe('');
    });
    test('only drawers marked resizable, on the left or right, can be resized', async ({ page }) => {
        const root = await mount(page, '<webui-drawer slot="right" class="a" width="400">A</webui-drawer><webui-drawer slot="top" class="b" resizable width="400">B</webui-drawer>');
        await expect(root.locator('webui-drawer.a .resize')).toBeHidden();
        await expect(root.locator('webui-drawer.b .resize')).toBeHidden();
        await expect.poll(() => root.locator('webui-drawer.a').evaluate(el => el.style.width)).toBe('');
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

test('a click inside data-stopclick stays inside, and checkboxes, labels and details there still work', async ({ page }) => {
    const root = await mount(page, `<div id="outer" data-toggleclass="#outer|hit"><div data-stopclick>
        <label><input type="checkbox" id="box"> Box</label>
        <details id="more"><summary>More</summary><p>Inside</p></details>
    </div></div>`);
    await root.getByText('Box').click();
    await expect(root.locator('#box')).toBeChecked();
    await root.locator('#box').click();
    await expect(root.locator('#box')).not.toBeChecked();
    await root.getByText('More').click();
    await expect(root.locator('#more')).toHaveAttribute('open', '');
    // None of those clicks reached the element around it.
    await expect(root.locator('#outer')).not.toHaveClass(/hit/);
});
test('removing data-dockable and data-moveable takes their buttons away', async ({ page }) => {
    const root = await mount(page, '<webui-drawer slot="left" data-dockable data-moveable></webui-drawer>');
    const drawer = root.locator('webui-drawer');
    await expect(drawer.locator('[slot="footer"] webui-toggle-icon')).toHaveCount(1);
    await expect(drawer.locator('[slot="footer"] .drawer-close')).toHaveCount(1);
    await drawer.evaluate(d => d.removeAttribute('data-dockable'));
    await expect(drawer.locator('[slot="footer"] webui-toggle-icon')).toHaveCount(0);
    await expect(drawer.locator('[slot="footer"] .drawer-close')).toHaveCount(0);
    await expect(drawer.locator('[slot="footer"] button[data-setattr]').first()).toBeAttached();
    await drawer.evaluate(d => d.removeAttribute('data-moveable'));
    await expect(drawer.locator('[slot="footer"] button[data-setattr]')).toHaveCount(0);
});
