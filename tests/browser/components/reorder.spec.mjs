import { test, expect, mount } from '../support/webui.mjs';

// webui-reorder is tested by the order its items end up in and the events it sends. Where the drop line is drawn is
// checked by eye; the pointer is only moved to an item, as a person would.
const LIST = `
<webui-reorder id="r" handle=".grip">
    <div class="item" data-id="a"><span class="grip" tabindex="0">A</span> <button class="other">Open a</button></div>
    <div class="item" data-id="b"><span class="grip" tabindex="0">B</span></div>
    <div class="item" data-id="c"><span class="grip" tabindex="0">C</span></div>
</webui-reorder>`;
const order = page => page.evaluate(() => [...document.querySelectorAll('#r .item')].map(item => item.dataset.id));

async function list(page, html = LIST) {
    const root = await mount(page, html);
    await page.evaluate(() => {
        window.__moves = [];
        document.querySelector('#r').addEventListener('reorder', ev => window.__moves.push(ev.detail.item.dataset.id));
    });
    return root.locator('#r');
}
const moves = page => page.evaluate(() => window.__moves);

/** Drags from one element to another with the mouse, as a person would. */
async function drag(page, from, to, side = 'below') {
    const a = await from.boundingBox();
    const b = await to.boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2 + 10, { steps: 3 });
    await page.mouse.move(b.x + b.width / 2, side === 'below' ? b.y + b.height - 1 : b.y + 1, { steps: 5 });
    await page.mouse.up();
}

test('Alt+Down and Alt+Up move the focused item one place, keep its focus, and say which moved', async ({ page }) => {
    const el = await list(page);
    const grip = el.locator('[data-id="a"] .grip');
    await grip.focus();
    await page.keyboard.press('Alt+ArrowDown');
    await expect.poll(() => order(page)).toEqual(['b', 'a', 'c']);
    await expect(grip).toBeFocused();
    await page.keyboard.press('Alt+ArrowDown');
    await expect.poll(() => order(page)).toEqual(['b', 'c', 'a']);
    // At the end it stays where it is, and nothing is said to have moved.
    await page.keyboard.press('Alt+ArrowDown');
    await page.keyboard.press('Alt+ArrowUp');
    await expect.poll(() => order(page)).toEqual(['b', 'a', 'c']);
    await expect.poll(() => moves(page)).toEqual(['a', 'a', 'a']);
});

test('keys on something in an item other than its handle move nothing', async ({ page }) => {
    const el = await list(page);
    await el.locator('.other').focus();
    await page.keyboard.press('Alt+ArrowDown');
    await page.keyboard.press('Tab');
    await expect(el.locator('[data-id="b"] .grip')).toBeFocused();
    await expect.poll(() => order(page)).toEqual(['a', 'b', 'c']);
    await expect.poll(() => moves(page)).toEqual([]);
});

test('dragging an item by its handle drops it where the pointer lets go', async ({ page }) => {
    const el = await list(page);
    await drag(page, el.locator('[data-id="a"] .grip'), el.locator('[data-id="c"]'), 'below');
    await expect.poll(() => order(page)).toEqual(['b', 'c', 'a']);
    await expect.poll(() => moves(page)).toEqual(['a']);
    await expect(el.locator('[data-reorder-drop]')).toHaveCount(0);
    await expect(el).not.toHaveAttribute('dragging');
    await drag(page, el.locator('[data-id="a"] .grip'), el.locator('[data-id="b"]'), 'above');
    await expect.poll(() => order(page)).toEqual(['a', 'b', 'c']);
});

test('a click on a handle without moving is still a click, and moves nothing', async ({ page }) => {
    const el = await list(page, LIST.replace('<span class="grip" tabindex="0">B</span>', '<button class="grip" onclick="window.__clicked = true">B</button>'));
    await el.locator('[data-id="b"] .grip').click();
    await expect.poll(() => page.evaluate(() => window.__clicked)).toBe(true);
    await expect.poll(() => order(page)).toEqual(['a', 'b', 'c']);
    await expect.poll(() => moves(page)).toEqual([]);
});

test('the click that ends a drag does not click the item', async ({ page }) => {
    const el = await list(page, LIST.replace('<span class="grip" tabindex="0">A</span>', '<button class="grip" onclick="window.__clicked = true">A</button>'));
    await drag(page, el.locator('[data-id="a"] .grip'), el.locator('[data-id="c"]'), 'below');
    await expect.poll(() => order(page)).toEqual(['b', 'c', 'a']);
    await expect.poll(() => page.evaluate(() => window.__clicked ?? false)).toBe(false);
});

test('items can be inside other elements, and markers with place say which side of them an item goes', async ({ page }) => {
    const el = await list(page, `
<webui-reorder id="r" items=".item" targets=".item, .marker" handle=".item">
    <div class="item" data-id="a">A</div>
    <div class="folder">
        <div class="marker" place="below">Folder start</div>
        <div class="item" data-id="b">B</div>
        <div class="marker" place="above">Folder end</div>
    </div>
    <div class="item" data-id="c">C</div>
</webui-reorder>`);
    await el.locator('[data-id="a"]').evaluate(node => { node.tabIndex = 0; node.focus(); });
    // Down from above the folder goes in at its start.
    await page.keyboard.press('Alt+ArrowDown');
    await expect.poll(() => page.evaluate(() => document.querySelector('[data-id="a"]').parentElement.className)).toBe('folder');
    await expect.poll(() => order(page)).toEqual(['a', 'b', 'c']);
    await page.keyboard.press('Alt+ArrowDown');
    await expect.poll(() => order(page)).toEqual(['b', 'a', 'c']);
    // Past the folder's end marker it leaves the folder.
    await page.keyboard.press('Alt+ArrowDown');
    await expect.poll(() => page.evaluate(() => document.querySelector('[data-id="a"]').parentElement.id)).toBe('r');
    // Markers never move themselves.
    await el.locator('.marker').first().evaluate(node => { node.tabIndex = 0; node.focus(); });
    await page.keyboard.press('Alt+ArrowDown');
    await expect(el.locator('.folder > .marker').first()).toHaveText('Folder start');
});

test('an item inside another item moves on its own', async ({ page }) => {
    const el = await list(page, `
<webui-reorder id="r" items=".item" handle=".grip">
    <div class="item" data-id="group"><span class="grip" tabindex="0">Group</span>
        <div class="item" data-id="x"><span class="grip" tabindex="0">X</span></div>
        <div class="item" data-id="y"><span class="grip" tabindex="0">Y</span></div>
    </div>
    <div class="item" data-id="z"><span class="grip" tabindex="0">Z</span></div>
</webui-reorder>`);
    await el.locator('[data-id="x"] > .grip').focus();
    await page.keyboard.press('Alt+ArrowDown');
    await expect.poll(() => order(page)).toEqual(['group', 'y', 'x', 'z']);
    await expect.poll(() => moves(page)).toEqual(['x']);
    // Moving the group carries what is in it.
    await el.locator('[data-id="group"] > .grip').focus();
    await page.keyboard.press('Alt+ArrowDown');
    await expect.poll(() => order(page)).toEqual(['z', 'group', 'y', 'x']);
});

test('a handle inside an item\'s shadow root starts the move', async ({ page }) => {
    const el = await list(page, `
<webui-reorder id="r" handle=".grip">
    <div class="item" data-id="a"></div>
    <div class="item" data-id="b"></div>
</webui-reorder>`);
    await page.evaluate(() => document.querySelectorAll('#r .item').forEach(item => {
        item.attachShadow({ mode: 'open' }).innerHTML = `<button class="grip">${item.dataset.id}</button>`;
    }));
    await el.locator('[data-id="a"] .grip').focus();
    await page.keyboard.press('Alt+ArrowDown');
    await expect.poll(() => order(page)).toEqual(['b', 'a']);
    await expect(el.locator('[data-id="a"] .grip')).toBeFocused();
});

test('hidden hides it, as on any element', async ({ page }) => {
    const root = await mount(page, '<webui-reorder id="r" hidden><div>One</div></webui-reorder>');
    await expect(root.locator('#r')).toBeHidden();
});

test('let go over another item, an item takes its place, in a column or a row, from middle to middle', async ({ page }) => {
    const middle = async (from, to) => {
        const a = await from.boundingBox();
        const b = await to.boundingBox();
        await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
        await page.mouse.down();
        await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 });
        await page.mouse.up();
    };
    let el = await list(page);
    await middle(el.locator('[data-id="a"] .grip'), el.locator('[data-id="b"] .grip'));
    await expect.poll(() => order(page)).toEqual(['b', 'a', 'c']);
    await middle(el.locator('[data-id="c"] .grip'), el.locator('[data-id="a"] .grip'));
    await expect.poll(() => order(page)).toEqual(['b', 'c', 'a']);
    el = await list(page, `
<webui-reorder id="r" handle=".grip" style="display:flex;gap:8px;">
    <button class="item grip" data-id="a" style="width:40px;height:40px;">A</button>
    <button class="item grip" data-id="b" style="width:40px;height:40px;">B</button>
    <button class="item grip" data-id="c" style="width:40px;height:40px;">C</button>
</webui-reorder>`);
    await middle(el.locator('[data-id="a"]'), el.locator('[data-id="b"]'));
    await expect.poll(() => order(page)).toEqual(['b', 'a', 'c']);
    await middle(el.locator('[data-id="c"]'), el.locator('[data-id="b"]'));
    await expect.poll(() => order(page)).toEqual(['c', 'b', 'a']);
});

test('items in a row move with Alt+Left and Alt+Right, and drop beside the item the pointer is over', async ({ page }) => {
    const el = await list(page, `
<webui-reorder id="r" handle=".grip" style="display:flex;gap:8px;">
    <button class="item grip" data-id="a" style="width:40px;height:40px;">A</button>
    <button class="item grip" data-id="b" style="width:40px;height:40px;">B</button>
    <button class="item grip" data-id="c" style="width:40px;height:40px;">C</button>
</webui-reorder>`);
    await el.locator('[data-id="a"]').focus();
    await page.keyboard.press('Alt+ArrowRight');
    await expect.poll(() => order(page)).toEqual(['b', 'a', 'c']);
    await page.keyboard.press('Alt+ArrowLeft');
    await expect.poll(() => order(page)).toEqual(['a', 'b', 'c']);
    // Dragged past the right half of the last item, it goes after it.
    const from = await el.locator('[data-id="a"]').boundingBox();
    const to = await el.locator('[data-id="c"]').boundingBox();
    await page.mouse.move(from.x + 20, from.y + 20);
    await page.mouse.down();
    await page.mouse.move(from.x + 30, from.y + 20, { steps: 3 });
    await page.mouse.move(to.x + to.width - 4, to.y + 20, { steps: 6 });
    await page.mouse.up();
    await expect.poll(() => order(page)).toEqual(['b', 'c', 'a']);
});
