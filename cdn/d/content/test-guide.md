
<webui-tabs pad="var(--padding)" vertical transition-timing="200">
<webui-button slot="tabs" align="left">Getting Started</webui-button>
<webui-paper slot="content">

## Your first test

Tests live in `tests/`, and every test file ends in `.spec.mjs`. This is a complete test file for a component:

```javascript:tests/components/quote.spec.mjs
import { test, expect, mount } from '../support/webui.mjs';

test('displays the content and citation', async ({ page }) => {
    const root = await mount(page, '<webui-quote cite="Someone">Words</webui-quote>');
    const quote = root.locator('webui-quote');
    await expect(quote).toContainText('Words');
    await expect(quote.locator('cite')).toHaveText('Someone');
});
```

Nearly every test follows the same three steps:

1. **Set up:** put some HTML on the page with `mount`, or set data with `page.evaluate`.
2. **Act:** click, type, or call a method.
3. **Check:** use `expect` to confirm what should have happened.

## Run it while you write it

Run only the file you are working on, so results come back in seconds:

```pwsh
npx playwright test tests/components/quote.spec.mjs
```

`npm run test:ui` is often easier while writing tests. It reruns a test whenever you save, and shows the page at every step.

## Check the test can fail

A test that cannot fail proves nothing. After a new test passes, briefly break the code or the expected value and confirm the test goes red. When testing a bug fix, write the test first and watch it fail on the old code.

## Where a new test goes

| What you are testing | File |
|---|---|
| A component | `tests/components/{component}.spec.mjs` |
| A `webui.*` method for text or values | `tests/methods/text.spec.mjs` |
| A `webui.*` method for data, roles, or storage | `tests/methods/data.spec.mjs` |
| A `webui.*` method for elements | `tests/methods/dom.spec.mjs` |
| A `webui.*` method for requests or waiting | `tests/methods/async.spec.mjs` |
| `webui.define` and the methods it gives elements | `tests/methods/define.spec.mjs` |
| `data-*` attributes and component loading | `tests/loader/binding.spec.mjs` |
| Routing, links, and clicks | `tests/loader/navigation.spec.mjs` |
| A real page on the site | `tests/loader/site.spec.mjs` |

## Adding a component or method

`tests/coverage.spec.mjs` fails until new code has tests, and names what is missing:

- **New component:** create `tests/components/{name}.spec.mjs`, where the name matches the file in `cdn/webui/`.
- **New `webui.*` member:** include `webui.memberName` in a test title.

</webui-paper>
<webui-button slot="tabs" align="left">Structuring Tests</webui-button>
<webui-paper slot="content">

## Name tests after behavior

The title appears in the failure report, so it should say what is supposed to happen. A good title explains a failure without opening the file.

- **Good:** `the close button hides it and records that`
- **Not as good:** `test close`

## Keep each test independent

Every test gets a new browser page, so tests cannot affect each other through data or storage. Tests also run in parallel and in no fixed order, so a test should never rely on another test having run.

## Share setup with a helper

When several tests in a file need the same setup, write a small function at the top of the file:

```javascript:A helper for repeated setup
import { test, expect, mount } from '../support/webui.mjs';

const dropdown = async (page, attributes) => {
    const root = await mount(page, `<webui-dropdown ${attributes}></webui-dropdown>`);
    return root.locator('webui-dropdown');
};

test('the value attribute picks the starting option', async ({ page }) => {
    const el = await dropdown(page, 'value="b" options="a,b,c"');
    await expect(el.locator('select')).toHaveValue('b');
});
```

## Repeat a test for a list of values

A loop creates one test per value, so a failure names the exact value that broke:

```javascript:One test per value
import { test, expect, mount } from '../support/webui.mjs';

for (const shape of ['circle', 'badge', 'shield']) {
    test(`shape ${shape} draws a backing`, async ({ page }) => {
        const root = await mount(page, `<webui-icon shape="${shape}"></webui-icon>`);
        await expect(root.locator('webui-icon path.backing')).toHaveAttribute('d', /^M/);
    });
}
```

## Run setup before each test

`test.beforeEach` runs before every test in the file:

```javascript:Waiting for the page before each test
import { test, expect } from '../support/webui.mjs';

test.use({ startUrl: '/about' });

test.beforeEach(async ({ page }) => {
    await expect(page.locator('webui-app main')).not.toHaveClass(/transition/);
});

test('the header is visible', async ({ page }) => {
    await expect(page.locator('webui-app > header')).toBeVisible();
});
```

## Group related tests

`test.describe` groups tests under a shared name, and can give them their own settings:

```javascript:A group with its own start page
import { test, expect } from '../support/webui.mjs';

test.describe('the contact page', () => {
    test.use({ startUrl: '/contact' });

    test('has the feedback link', async ({ page }) => {
        await expect(page.locator('a[data-click="feedback"]').first()).toBeAttached();
    });
});
```

</webui-paper>
<webui-button slot="tabs" align="left">The Test Page</webui-button>
<webui-paper slot="content">

## What is ready when a test starts

`tests/support/webui.mjs` replaces Playwright's normal `test`, so always import from there. Before your test runs, `page` has already:

- Opened a blank page with `webui-app-config` and the Web UI stylesheet.
- Finished loading the loader, markdown parser, app config, and user roles.
- Started serving every request from `cdn/` without a server.
- Started watching for uncaught errors.

The blank page has no `webui-app`, so no page content loads and nothing you mount gets replaced.

## mount

`mount(page, html)` puts HTML on the page, and waits for every `webui-*` and `app-*` tag in it to be defined. It returns a locator for the container. Calling it again replaces the previous content.

`mount` only waits for components to be defined. A component's `connected` method can run later, so use checks that retry, like `await expect(...)`.

## Testing the real site shell

Routing, `webui-app`, and page content need the real `index.html`. Set `startUrl` at the top of the file or in a `test.describe`:

```javascript:Starting on a real page
import { test, expect } from '../support/webui.mjs';

test.use({ startUrl: '/about' });

test('webui.navigateTo changes page without a reload', async ({ page }) => {
    await expect(page.locator('webui-app main')).not.toHaveClass(/transition/);
    await page.evaluate(() => { window.sameDocument = true; webui.navigateTo('/contact'); });
    await expect(page).toHaveURL(/\/contact$/);
    expect(await page.evaluate(() => window.sameDocument)).toBe(true);
});
```

## Source and minified files

| Command | Files loaded |
|---|---|
| `npm test` | Source files, even when `.min.js` is requested |
| `npm run test:min` | The real `.min.js` files |

Stack traces show the requested file name, so during `npm test` you can see `icon.min.js:93` when the line is really in `icon.js`. A failure only under `test:min` usually means a min file was not regenerated.

## Errors that fail a test automatically

A test fails when any of these happen while it runs, even if every check passes:

- An uncaught error.
- A promise rejected with a `TypeError`, `ReferenceError`, or `SyntaxError`.
- A subscriber throwing while receiving data, logged as `Error setting data`.

Promises rejected for other reasons don't count, such as a canceled dialog. `Failed to fetch` is also ignored, because requests outside the site are blocked during tests.

## How requests are answered

| Request | Response |
|---|---|
| `localhost` and `cdn.myfi.ws` | The matching file in `cdn/` |
| A page route with no file extension | `index.html`, like the deployed site |
| A missing file | A 404 |
| `api.myfi.ws` | `0` with status 200, which means a guest for the roles API |
| Anything else | Blocked |

</webui-paper>
<webui-button slot="tabs" align="left">Finding Elements</webui-button>
<webui-paper slot="content">

## Locators

A locator describes how to find an element, and looks it up again each time it is used. Locators see inside open shadow DOM automatically, which suits Web UI well:

```javascript:Reaching inside shadow DOM
import { test, expect, mount } from '../support/webui.mjs';

test('the close button is inside the shadow DOM', async ({ page }) => {
    const root = await mount(page, '<webui-alert show>Hello</webui-alert>');
    await root.locator('webui-alert #close').click();
    await expect(root.locator('webui-alert')).not.toHaveAttribute('show');
});
```

## Common ways to find elements

| Code | Finds |
|---|---|
| `root.locator('webui-alert')` | Elements by CSS selector, in the mounted content |
| `page.locator('.webui-alerts-popup')` | Elements anywhere on the page |
| `el.locator('option')` | Elements inside another locator |
| `el.locator(':scope > webui-button')` | Direct children only |
| `items.first()`, `items.last()`, `items.nth(1)` | One element from several |
| `items.filter({ hasText: 'Save' })` | Elements containing some text |
| `page.getByRole('button', { name: 'Save' })` | Elements by accessible role and name |

## When a locator matches too many elements

Actions and most checks fail with `strict mode violation` when a locator matches more than one element. Make the selector more specific, or pick one with `first()` or `nth()`.

This happens more often in Web UI because the loader copies classes from a component onto the top level `slot` in its shadow DOM. `.next-page-pre` matches both the element and its slot, so use `webui-flex.next-page-pre`.

## Text includes shadow DOM

`toHaveText` reads text inside shadow DOM as well. A `webui-quote` with a citation has both pieces of text, so `toHaveText('Words')` fails. Use `toContainText`, or check a more specific element.

## Attributes components remove

Some components change their own attributes. `webui-input-text` and `webui-input-range` move `id` onto their inner field, and tooltips turn `title` into `aria-label` on hover. Select these by tag or position rather than `id`.

</webui-paper>
<webui-button slot="tabs" align="left">Checking Results</webui-button>
<webui-paper slot="content">

## Checks that retry

Checks on a locator or page retry for up to 5 seconds until they pass. Most Web UI work finishes a moment later, so these are the best choice. Don't forget `await`.

| Check | Passes when |
|---|---|
| `toHaveText('x')` | The text is exactly `x`, ignoring extra whitespace |
| `toContainText('x')` | The text includes `x` |
| `toHaveAttribute('a', 'b')` | Attribute `a` has value `b`. Regular expressions work too |
| `toHaveClass(/open/)` | The class matches. A plain string must match the entire class list |
| `toHaveCount(2)` | The locator matches this many elements |
| `toHaveValue('x')` | A field has this value |
| `toBeVisible()`, `toBeHidden()` | The element is displayed or not |
| `toBeAttached()` | The element exists, whether or not it is displayed |
| `toBeDisabled()`, `toBeEnabled()` | A field's disabled state |
| `toBeInViewport()` | The element is on screen |
| `page` with `toHaveURL(/x/)`, `toHaveTitle('x')` | The address or title matches |

Add `.not` to check the opposite, such as `expect(el).not.toHaveClass(/open/)`. `toHaveText` also accepts a list, with one entry per matched element.

## Checks on plain values

These check a value once, with no retry. Use them for values that are already final, such as the return value of a synchronous method:

| Check | Passes when |
|---|---|
| `expect(value).toBe(5)` | Exactly equal. Use for strings, numbers, and booleans |
| `expect(value).toEqual({ a: 1 })` | Equal by content. Use for objects and arrays |
| `expect(value).toMatchObject({ a: 1 })` | The object includes these fields |
| `expect(text).toContain('x')`, `toMatch(/x/)` | The text includes or matches |
| `expect(n).toBeGreaterThan(1)`, `toBeLessThan(9)` | The number is in range |
| `expect(value).toBeUndefined()`, `toBeNull()` | The value is missing |

## Retrying your own check

`expect.poll` keeps calling a function until its result passes. Use it when a value changes over time but is not on a locator, such as data:

```javascript:Waiting for a value to change
import { test, expect, mount } from '../support/webui.mjs';

test('data-trigger writes the value on click', async ({ page }) => {
    const root = await mount(page, '<webui-button data-trigger="my-key" data-value="42">Go</webui-button>');
    await root.locator('webui-button').click();
    await expect.poll(() => page.evaluate(() => webui.getData('my-key'))).toBe('42');
});
```

## Changing the time limit

Pass `timeout` in milliseconds to a retrying check. Give slow work longer, such as `webui-content`, which waits at least 500ms before loading:

```javascript:Allowing more time
import { test, expect, mount } from '../support/webui.mjs';

test('nest renders the content inside the element', async ({ page }) => {
    const root = await mount(page, '<webui-content nest src="/robots.txt" load-delay="0"></webui-content>');
    await expect(root.locator('webui-content')).toContainText('User-agent', { timeout: 8000 });
});
```

## Adding a message

A second argument to `expect` labels the check in the failure report:

```javascript:A labeled check
import { test, expect } from '../support/webui.mjs';

test('webui.isLocalhost is true during tests', async ({ page }) => {
    const isLocal = await page.evaluate(() => webui.isLocalhost);
    expect(isLocal, 'tests should run on localhost').toBe(true);
});
```

## Checking that something did not happen

Retrying checks pass the moment the condition is true, so they can pass before something goes wrong. To confirm nothing happens, wait briefly, and then check. This is the one good use for a fixed wait:

```javascript:Confirming nothing happened
import { test, expect, mount } from '../support/webui.mjs';

test('stays put while the data has a value', async ({ page }) => {
    await page.evaluate(() => webui.setData('needed-key', 'yes'));
    await mount(page, '<webui-page-requires data-subscribe="needed-key"></webui-page-requires>');
    await page.waitForTimeout(100);
    await expect(page).toHaveURL(/__blank/);
});
```

</webui-paper>
<webui-button slot="tabs" align="left">Running Code</webui-button>
<webui-paper slot="content">

## page.evaluate

Tests run in Node, and the framework runs in the browser. `page.evaluate` sends a function to the browser and returns its result, which is how tests reach `webui`:

```javascript:Calling webui from a test
import { test, expect } from '../support/webui.mjs';

test('webui.clone deep copies', async ({ page }) => {
    const result = await page.evaluate(() => {
        const original = { one: [1, 2] };
        const copy = webui.clone(original);
        original.one.shift();
        return copy;
    });
    expect(result).toEqual({ one: [1, 2] });
});
```

## Passing values in

The function runs in the browser, so it cannot see variables from the test. Pass them as the second argument:

```javascript:Passing arguments to the browser
import { test, expect } from '../support/webui.mjs';

test('webui.repeat repeats text', async ({ page }) => {
    const [text, count] = ['ab', 3];
    const result = await page.evaluate(([text, count]) => webui.repeat(text, count), [text, count]);
    expect(result).toBe('ababab');
});
```

## Running code on an element

`locator.evaluate` passes the element to your function. Use it to call component methods or read properties:

```javascript:Calling a component method
import { test, expect, mount } from '../support/webui.mjs';

test('setValue displays the text', async ({ page }) => {
    const root = await mount(page, '<webui-alert></webui-alert>');
    const alert = root.locator('webui-alert');
    await alert.evaluate(el => el.setValue('Saved', 'success'));
    await expect(alert).toHaveText('Saved');
    expect(await alert.evaluate(el => el.hasAttribute('show'))).toBe(true);
});
```

`locator.evaluateAll` does the same with an array of every matched element.

## What can come back

Results are copied from the browser to Node, so return plain values: text, numbers, arrays, and simple objects. Functions and elements don't come through usefully, so return what you need from an element instead of the element itself.

Async functions are awaited for you. That also means returning a promise that never finishes hangs until the test times out. `webui.dialog()` stays pending until the dialog closes, so use a block with no return value:

```javascript:Opening a dialog without waiting for it to close
import { test, expect, mount } from '../support/webui.mjs';

test('the dialog opens', async ({ page }) => {
    const root = await mount(page, '<webui-dialogs></webui-dialogs>');
    await page.evaluate(() => { webui.dialog({ content: 'Hello' }).catch(() => {}); });
    await expect(root.locator('webui-dialogs dialog')).toContainText('Hello');
});
```

## Defining a test component

`webui.define` works in a test, which is handy for testing loader behavior. Use a unique `app-` name, and define it before mounting so nothing tries to download it:

```javascript:A throwaway component
import { test, expect, mount } from '../support/webui.mjs';

test('data-subscribe calls named setters', async ({ page }) => {
    await page.evaluate(() => webui.define('app-example', { setMyKey(value) { this.got = value; } }));
    const root = await mount(page, '<app-example data-subscribe="my-key"></app-example>');
    await page.evaluate(() => webui.setData('my-key', 5));
    await expect.poll(() => root.locator('app-example').evaluate(el => el.got)).toBe(5);
});
```

## Replacing browser features

Assign over a browser feature that a test should not really use, such as the clipboard:

```javascript:Replacing the clipboard
import { test, expect, mount } from '../support/webui.mjs';

test('the copy icon copies the code', async ({ page }) => {
    const root = await mount(page, '<webui-code>abc</webui-code>');
    await page.evaluate(() => {
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: async value => { window.copied = value; } },
            configurable: true,
        });
    });
    await root.locator('webui-code label webui-icon').click();
    await expect.poll(() => page.evaluate(() => window.copied)).toBe('abc');
});
```

</webui-paper>
<webui-button slot="tabs" align="left">User Actions</webui-button>
<webui-paper slot="content">

## Acting like a user

Prefer these over setting values directly, because they fire the same events a real person would. They also wait for the element to be visible and able to receive the action.

| Code | Action |
|---|---|
| `el.click()`, `el.hover()` | Click or move the mouse over it |
| `el.fill('text')` | Replace the text in a field, firing `input` |
| `el.press('Control+Enter')` | Focus it and press keys |
| `el.selectOption('2')` | Pick options in a `select` |
| `el.setInputFiles([...])` | Choose files in a file input |
| `page.keyboard.press('Escape')` | Press a key wherever focus is |
| `page.mouse.click(5, 5)` | Click a position on the page |
| `page.setViewportSize({ width: 600, height: 700 })` | Resize the window |
| `page.goBack()`, `page.goForward()`, `page.reload()` | Use the browser controls |

Fill fields inside a component by locating the inner field:

```javascript:Typing into a component
import { test, expect, mount } from '../support/webui.mjs';

test('typing does not change ordinary text', async ({ page }) => {
    const root = await mount(page, '<webui-input-text></webui-input-text>');
    const field = root.locator('webui-input-text input');
    await field.fill('Tom & Jerry');
    await expect(field).toHaveValue('Tom & Jerry');
});
```

## Choosing files

Files can be created inside the test, with nothing on disk:

```javascript:Selecting a file
import { test, expect, mount } from '../support/webui.mjs';

test('selected files reach data-trigger', async ({ page }) => {
    const root = await mount(page, '<webui-file-select data-trigger="my-files"></webui-file-select>');
    await root.locator('webui-file-select input').setInputFiles([
        { name: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('words') },
    ]);
    await expect.poll(() => page.evaluate(() => webui.getData('my-files')?.[0].content)).toBe('words');
});
```

## When a real click is not possible

`click()` fails if the element is off screen or covered. Hidden `webui-drawer` content and undocked elements are common cases. Calling the element's own `click` skips those checks:

```javascript:Clicking without the visibility checks
await button.evaluate(el => el.click());
```

## Disabled buttons ignore clicks

`webui-button` joins forms, so the browser ignores `el.click()` while it has `disabled`. `webui-pagination` updates its buttons about 200ms after a page change, so wait for the button first:

```javascript:Waiting for a button to be enabled
await expect(button).not.toHaveAttribute('disabled');
```

</webui-paper>
<webui-button slot="tabs" align="left">Network and Timing</webui-button>
<webui-paper slot="content">

## Answering a request yourself

`page.route` takes over any request matching a URL pattern. In a pattern, `*` matches within one path segment and `**` matches anything. Routes added in a test take priority over the default file serving:

```javascript:Faking an API response
import { test, expect, mount } from '../support/webui.mjs';

test('src loads cards', async ({ page }) => {
    await page.route('**/my-cards.json', route => route.fulfill({
        contentType: 'application/json',
        body: '[{"name":"Loaded"}]',
    }));
    const root = await mount(page, '<webui-cards src="/my-cards.json"></webui-cards>');
    await expect(root.locator('webui-card header section')).toHaveText('Loaded');
});
```

## Other route options

| Code | Result |
|---|---|
| `route.fulfill({ status: 500, body: 'Broken' })` | Responds with an error status |
| `route.abort()` | Fails like a lost connection |
| `route.fallback()` | Continues to the default file serving |
| `route.request().postData()` | Reads the request body |
| `route.request().headers()` | Reads the request headers, with lowercase names |

Set up routes before the code that makes the request, which usually means before `mount`.

## Checking what was sent

Save what the request contained from inside the route, then check it:

```javascript:Inspecting a request
import { test, expect, mount } from '../support/webui.mjs';

test('a message posts as text', async ({ page }) => {
    let sent;
    await page.route('**/feedback', route => {
        sent = route.request().postData();
        return route.fulfill({ body: 'Thanks' });
    });
    const root = await mount(page, '<webui-dialogs></webui-dialogs><webui-feedback data-post="http://localhost:3199/feedback"></webui-feedback>');
    await root.locator('webui-feedback').evaluate(el => el.click());
    const dialog = root.locator('webui-dialogs dialog');
    await dialog.locator('textarea').fill('Hello');
    await dialog.locator('#dlg-confirm').click();
    await expect(dialog).toBeHidden();
    expect(sent).toBe('Hello');
});
```

## Counting requests

`page.on('request')` sees every request, which is useful for confirming something only loads once:

```javascript:Counting requests
import { test, expect, mount } from '../support/webui.mjs';

test('identical icons share one request', async ({ page }) => {
    let requests = 0;
    page.on('request', request => {
        if (request.url().endsWith('/icons/bell.webui')) requests++;
    });
    const root = await mount(page, '<webui-icon icon="bell"></webui-icon>'.repeat(5));
    await expect(root.locator('webui-icon').nth(4).locator('path.i1')).toHaveAttribute('d', /^M/);
    expect(requests).toBe(1);
});
```

## Reproducing timing bugs

Files load instantly during tests, which hides bugs that only happen on a slow connection. To expose one, delay the script or data with `route.fallback()`. This makes the slow case happen on every run:

```javascript:Slowing down a component
import { test, expect, mount } from '../support/webui.mjs';

test('the value still arrives when the component loads slowly', async ({ page }) => {
    await page.route('**/webui/condition.*', async route => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.fallback();
    });
    const root = await mount(page, '<webui-condition data-subscribe="my-key:setValue"><template slot="invalid">none</template></webui-condition>');
    await expect(root.locator('webui-condition')).toHaveText('none');
});
```

Use `**/webui/condition.*` rather than `.min.js`, so the pattern matches in both `npm test` and `npm run test:min`.

## Watching the console

`page.waitForEvent` waits for a console message. Start waiting before the code that logs it:

```javascript:Waiting for a console message
import { test, mount } from '../support/webui.mjs';

test('an unknown icon warns', async ({ page }) => {
    const warning = page.waitForEvent('console', message => message.text().includes('missing icon'));
    await mount(page, '<webui-icon icon="no-such-icon"></webui-icon>');
    await warning;
});
```

## Things that fire at startup

On the real site shell, page content arrives shortly after the test starts. Wait for `main` to lose its `transition` class before changing page content, or the loading page can replace your change.

Resizing is debounced by 150ms. A resize just before `mount` can reach a component while it is still loading, so wait 250ms after `setViewportSize` when that matters.

</webui-paper>
<webui-button slot="tabs" align="left">Known Bugs</webui-button>
<webui-paper slot="content">

## Recording a bug without fixing it

When you find a bug you aren't fixing yet, write the test for the correct behavior, then mark it as expected to fail. The first line of the test should explain the bug:

```javascript:A known bug
import { test, expect } from '../support/webui.mjs';

test('webui.displayLeadingZero pads to the documented total length', async ({ page }) => {
    test.fail(true, 'Known bug: the docs say count is the total length, but it adds one extra digit');
    const result = await page.evaluate(() => webui.displayLeadingZero(5, 2));
    expect(result).toBe('05');
});
```

The suite stays green, and the bug stays visible in the code.

## When the bug gets fixed

The test now reports `Expected to fail, but passed`, which is your cue to delete the `test.fail` line. It then becomes a normal test that protects the fix.

## Finding the current list

```pwsh
grep -rn "Known bug:" tests
```

## Keeping them reliable

A known bug test has to fail on every run. For timing bugs, force the slow case with `page.route` as shown in Network and Timing, and use a short `timeout` so it fails quickly:

```javascript:A known timing bug
import { test, expect, mount } from '../support/webui.mjs';

test('keeps the total when pagination loads after the icon list', async ({ page }) => {
    test.fail(true, 'Known bug: webui-pagination is not in preload, so the total is lost');
    await page.route('**/webui/pagination.*', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fallback();
    });
    const root = await mount(page, '<webui-icon-search></webui-icon-search>');
    await page.evaluate(() => customElements.whenDefined('webui-pagination'));
    await expect.poll(() => root.locator('webui-icon-search').evaluate(el => el.totalCount), { timeout: 2000 }).toBeGreaterThan(20);
});
```

## Other markers

| Code | Use |
|---|---|
| `test.only('...')` | Run only this test while debugging. Never commit it |
| `test.skip('...')` | Don't run this test. Prefer `test.fail` for bugs, since a skipped test never tells you when the bug is fixed |
| `test.slow()` | Give this test three times as long before it times out |

</webui-paper>
<webui-button slot="tabs" align="left">Debugging</webui-button>
<webui-paper slot="content">

## Reading a failure

A failure names the file and line, shows expected and received values, and quotes the failing code. If the message says `Uncaught errors happened while this test ran`, the checks may have passed, and the stack trace below it shows the error.

## Tools

| Command | What it does |
|---|---|
| `npm run test:ui` | Runs tests in a window with a timeline, the page at each step, and rerun on save |
| `npm run test:report` | Opens the last report, with a screenshot and trace for each failure |
| `npx playwright test file --debug` | Opens a visible browser and steps through the test |
| `npx playwright test file --headed` | Shows the browser while the test runs |
| `npx playwright test -g "name"` | Runs tests with a matching title |
| `npx playwright test --last-failed` | Reruns only what just failed |
| `npx playwright show-trace path/trace.zip` | Opens a trace saved in `test-results` |

Add `--project=min` to any `npx` command to run against the minified files.

## Traces

Each failed test saves a trace in `test-results/`. It records every step with the page as it looked, console output, and network requests. This usually answers what the page looked like when a check failed, without rerunning anything.

## Looking at state during a test

`console.log` in a test prints to the terminal. To see browser logs there as well, add this at the start of the test:

```javascript:Printing browser console messages
page.on('console', message => console.log(message.text()));
```

`await page.pause()` stops a test and opens the inspector, when run with `--headed`.

## Finding flaky tests

A test that sometimes fails usually has a real timing problem, either in the test or in the framework. Run it many times to find out:

```pwsh
npx playwright test tests/components/alert.spec.mjs --repeat-each=10
```

Running the full suite with `--repeat-each=3` adds heavy load, which brings out timing problems that a single run hides.

## Common causes

| Symptom | Likely cause |
|---|---|
| Passes alone, fails in the full suite | The check runs before slow work finishes. Use a retrying check |
| Passes in `npm test`, fails in `test:min` | The `.min.js` file is out of date |
| Timeout inside `page.evaluate` | The function returned a promise that never finishes |
| `strict mode violation` | The locator matched several elements, often an element and its `slot` |
| `element(s) not found` for an `id` | The component moved or removed the `id` |
| `Expected to fail, but passed` | A known bug was fixed, or its test doesn't reliably fail |
| A click does nothing | The element has `disabled`, or the click happened before it was ready |
| A value set by a test gets replaced | Startup work finished afterward, such as page content loading |

## Things to avoid

- **Fixed waits instead of checks:** `waitForTimeout` makes tests slow and still unreliable. Only use it to confirm that something did not happen.
- **Missing `await`:** without it, a check never gets the chance to fail the test.
- **Checking internals when behavior will do:** prefer what a user would see over private fields such as `_data`, so tests survive refactoring.
- **Placeholders in this guide:** page content replaces data placeholders even inside code blocks, so write examples without real data keys in curly braces.

</webui-paper>
</webui-tabs>
