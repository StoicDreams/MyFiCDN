import { test, expect, mount } from '../support/webui.mjs';

const restricted = async (page, role) => {
    const root = await mount(page, `<webui-restrict-to-role role="${role}"><template slot="valid">SECRET</template><template slot="invalid">NOPE</template></webui-restrict-to-role>`);
    return root.locator('webui-restrict-to-role');
};
const setRole = (page, role) => page.evaluate(role => webui.setData('session-user-role', role), role);

test('a user without the role sees the invalid content', async ({ page }) => {
    const el = await restricted(page, 4);
    await setRole(page, 1);
    await expect(el).toHaveText('NOPE');
    await setRole(page, 3);
    await expect(el).toHaveText('NOPE');
});
test('a user with the role sees the valid content', async ({ page }) => {
    const el = await restricted(page, 4);
    await setRole(page, 4);
    await expect(el).toHaveText('SECRET');
    await setRole(page, 5);
    await expect(el).toHaveText('SECRET');
});
test('role 0 only shows to guests', async ({ page }) => {
    const el = await restricted(page, 0);
    await expect(el).toHaveText('SECRET');
    await setRole(page, 1);
    await expect(el).toHaveText('NOPE');
});
test('content updates when the role attribute changes', async ({ page }) => {
    const el = await restricted(page, 4);
    await setRole(page, 1);
    await expect(el).toHaveText('NOPE');
    await el.evaluate(c => c.setAttribute('role', '1'));
    await expect(el).toHaveText('SECRET');
});
