import { test, expect } from '../support/webui.mjs';

// Parses markdown in the browser with the loaded parser, so tests check what pages get.
async function md(page, text, noParagraph) {
    await page.waitForFunction(() => webui.markdown && webui.markdown.constructor.name === 'MarkdownParser');
    return page.evaluate(([text, noParagraph]) => webui.parseMarkdown(text, false, noParagraph).trim(), [text, noParagraph]);
}
// Parses into a detached element, for checks on structure rather than exact html.
async function mdDom(page, text, read) {
    await page.waitForFunction(() => webui.markdown && webui.markdown.constructor.name === 'MarkdownParser');
    return page.evaluate(([text, read]) => {
        const div = document.createElement('div');
        div.innerHTML = webui.parseMarkdown(text);
        return new Function('div', `return (${read})(div)`)(div);
    }, [text, read.toString()]);
}

test.describe('webui.parseMarkdown task lists', () => {
    test('checked and unchecked items get a class and a disabled checkbox', async ({ page }) => {
        const items = await mdDom(page, '- [ ] Todo\n- [x] Done\n- [X] Also done\n* [ ] Star\n+ [x] Plus', div =>
            [...div.querySelectorAll('li')].map(li => [li.className, li.querySelector('input.task')?.checked, li.querySelector('input')?.disabled, li.textContent]));
        expect(items).toEqual([
            ['unchecked', false, true, 'Todo'],
            ['checked', true, true, 'Done'],
            ['checked', true, true, 'Also done'],
            ['unchecked', false, true, 'Star'],
            ['checked', true, true, 'Plus'],
        ]);
    });
    test('ordered and nested lists can hold tasks', async ({ page }) => {
        const html = await md(page, '1. [x] First\n2. [ ] Second\n   - [ ] Nested');
        expect(html).toContain('<ol><li class="checked"><input type="checkbox" class="task" disabled checked>First');
        expect(html).toContain('<ul><li class="unchecked"><input type="checkbox" class="task" disabled>Nested');
    });
    test('brackets that are not a task stay as text', async ({ page }) => {
        expect(await md(page, '- [ ]text\n- [link](x)')).toBe('<ul><li>[ ]text</li>\n<li><a href="x">link</a></li>\n</ul>');
    });
    test('the checkbox is hidden, so only the drawn box shows', async ({ page }) => {
        await page.waitForFunction(() => webui.markdown);
        const box = await page.evaluate(() => {
            const div = document.createElement('div');
            div.innerHTML = webui.parseMarkdown('- [x] Done');
            document.body.appendChild(div);
            const input = div.querySelector('input');
            return [getComputedStyle(input).opacity, input.getBoundingClientRect().width, getComputedStyle(div.querySelector('li'), '::before').backgroundImage.includes('svg')];
        });
        expect(box).toEqual(['0', 1, true]);
    });
});

test.describe('webui.parseMarkdown lists', () => {
    test('plus bullets, ") " numbers, and a starting number', async ({ page }) => {
        expect(await md(page, '+ a\n+ b')).toBe('<ul><li>a</li>\n<li>b</li>\n</ul>');
        expect(await md(page, '1) a\n2) b')).toBe('<ol><li>a</li>\n<li>b</li>\n</ol>');
        expect(await md(page, '3. a\n4. b')).toBe('<ol start="3"><li>a</li>\n<li>b</li>\n</ol>');
    });
    test('blank lines between items keep one list', async ({ page }) => {
        expect(await md(page, '- a\n\n- b\n\nAfter')).toBe('<ul><li>a</li>\n<li>b</li>\n</ul>\n\n<p>After</p>');
    });
    test('indented text under an item stays in that item', async ({ page }) => {
        expect(await md(page, '- one\n  more\n- two')).toBe('<ul><li>one<br>more</li>\n<li>two</li>\n</ul>');
    });
});

test.describe('webui.parseMarkdown blocks', () => {
    test('***text*** is bold and italic, not a line', async ({ page }) => {
        expect(await md(page, '***both*** words')).toBe('<p><strong><em>both</em></strong> words</p>');
    });
    test('lines of three or more -, *, or _ draw a line, with an optional theme', async ({ page }) => {
        expect(await md(page, '***\n- - -\n___\n---success')).toBe('<webui-line></webui-line>\n<webui-line></webui-line>\n<webui-line></webui-line>\n<webui-line theme="success"></webui-line>');
    });
    test('headings drop closing hashes and can set an id', async ({ page }) => {
        expect(await md(page, '## Closed ##')).toBe('<h2>Closed</h2>');
        expect(await md(page, '## Learn C#')).toBe('<h2>Learn C#</h2>');
        expect(await md(page, '### Section {#part-2}')).toBe('<h3 id="part-2" hash="part-2">Section</h3>');
        expect(await md(page, '#hashtag')).toBe('<p>#hashtag</p>');
    });
    test('tilde fences are code blocks', async ({ page }) => {
        expect(await md(page, '~~~js:Label\nlet a = `x`;\n```\n~~~')).toBe('<webui-code language="js" label="Label">\nlet a = `x`;\n```\n</webui-code>');
    });
    test('a line with a pipe is text unless a delimiter row follows', async ({ page }) => {
        expect(await md(page, 'This | that')).toBe('<p>This | that</p>');
        expect(await md(page, 'a | b\nc | d')).toBe('<p>a | b</p>\n<p>c | d</p>');
        expect(await md(page, 'a | b\n--|--\n1 | 2')).toContain('<td class="text-justify">1</td>');
    });
    test('table cells keep escaped pipes and pipes in code, and :-- aligns left', async ({ page }) => {
        const cells = await mdDom(page, '| a | b |\n|:--|--:|\n| `x|y` | c \\| d |', div =>
            [...div.querySelectorAll('th, td')].map(c => [c.className, c.innerHTML]));
        expect(cells).toEqual([['text-left', 'a'], ['text-right', 'b'], ['text-left', '<code>x|y</code>'], ['text-right', 'c | d']]);
    });
    test('definition lists', async ({ page }) => {
        expect(await md(page, 'Apple\n: A fruit\n: A company\nCherry\n: Red')).toBe('<dl><dt>Apple</dt>\n<dd>A fruit</dd>\n<dd>A company</dd>\n<dt>Cherry</dt>\n<dd>Red</dd>\n</dl>');
    });
});

test.describe('webui.parseMarkdown links', () => {
    test('angle bracket links and emails', async ({ page }) => {
        expect(await md(page, '<https://a.com> <me@a.com>')).toBe('<p><a href="https://a.com">https://a.com</a> <a href="mailto:me@a.com">me@a.com</a></p>');
    });
    test('bare urls leave off ending punctuation and are not linked twice', async ({ page }) => {
        expect(await md(page, 'See https://a.com.')).toBe('<p>See <a href="https://a.com">https://a.com</a>.</p>');
        expect(await md(page, '[https://a.com](https://a.com)')).toBe('<p><a href="https://a.com">https://a.com</a></p>');
        expect(await md(page, '<a href="x">https://a.com</a>')).toBe('<a href="x">https://a.com</a>');
    });
    test('urls can hold parentheses, and quotes cannot leave the attribute', async ({ page }) => {
        expect(await md(page, '[w](https://w.org/A_(b))')).toBe('<p><a href="https://w.org/A_(b)">w</a></p>');
        expect(await md(page, `[t](x 'Single')`)).toBe('<p><a href="x" title="Single">t</a></p>');
        expect(await md(page, '![a "b"](x.png)')).toBe('<p><img alt="a &quot;b&quot;" src="x.png" /></p>');
    });
    test('emphasis applies inside and around links', async ({ page }) => {
        expect(await md(page, '**[b](x)** [*e*](y)')).toBe('<p><strong><a href="x">b</a></strong> <a href="y"><em>e</em></a></p>');
    });
    test('reference links and images', async ({ page }) => {
        const html = await md(page, 'See [docs][d], [Docs], [x][], and ![logo][img].\n\n[d]: https://a.com "A"\n[docs]: https://b.com\n[x]: <https://c.com>\n[img]: /logo.png');
        expect(html).toBe('<p>See <a href="https://a.com" title="A">docs</a>, <a href="https://b.com">Docs</a>, <a href="https://c.com">x</a>, and <img alt="logo" src="/logo.png" />.</p>');
    });
    test('brackets without a definition stay as text, and definitions in code stay', async ({ page }) => {
        expect(await md(page, '[not defined] text')).toBe('<p>[not defined] text</p>');
        expect(await md(page, '```\n[d]: keep\n```')).toContain('[d]: keep');
    });
    test('footnotes are numbered by first use and listed at the end', async ({ page }) => {
        const notes = await mdDom(page, 'One[^a] two[^b] again[^a].\n\n[^a]: First *note*.\n[^b]: Second.', div => ({
            refs: [...div.querySelectorAll('sup a')].map(a => [a.textContent, a.getAttribute('href'), a.getAttribute('hash')]),
            notes: [...div.querySelectorAll('.footnotes li')].map(li => [li.getAttribute('hash'), li.innerHTML.replace(/ <a.*/, '')]),
            back: div.querySelector('.footnotes li a').getAttribute('href'),
        }));
        expect(notes).toEqual({
            refs: [['1', '#fn-a', 'fnref-a'], ['2', '#fn-b', 'fnref-b'], ['1', '#fn-a', null]],
            notes: [['fn-a', 'First <em>note</em>.'], ['fn-b', 'Second.']],
            back: '#fnref-a',
        });
    });
    test('footnotes and references in a blockquote use the page definitions', async ({ page }) => {
        const html = await md(page, '> Quote[^q] with [link]\n\n[^q]: Note\n[link]: https://a.com');
        expect(html).toContain('<a href="https://a.com">link</a>');
        expect(html).toContain('href="#fn-q"');
        expect(html).toContain('<li id="fn-q"');
    });
});

test.describe('webui.parseMarkdown inline', () => {
    test('highlight, superscript, and subscript', async ({ page }) => {
        expect(await md(page, '==mark== x^2^ H~2~O ~~del~~')).toBe('<p><mark>mark</mark> x<sup>2</sup> H<sub>2</sub>O <del>del</del></p>');
    });
    test('tildes with spaces between them are left alone', async ({ page }) => {
        expect(await md(page, 'about ~5 min or ~10 min')).toBe('<p>about ~5 min or ~10 min</p>');
    });
    test('times are not read as emoji', async ({ page }) => {
        expect(await md(page, 'At 10:30:00 :smile:')).toBe('<p>At 10:30:00 <webui-emoji emoji="smile"></webui-emoji></p>');
    });
    test('escapes keep characters as text, and are left as written in code', async ({ page }) => {
        expect(await md(page, '\\*a\\* \\<b\\> \\:smile\\: \\| \\`code\\`')).toBe('<p>*a* &lt;b&gt; :smile: | `code`</p>');
        expect(await md(page, '`a\\_b`')).toBe('<p><code>a\\_b</code></p>');
    });
    test('the noParagraph result is cached apart from the paragraph result', async ({ page }) => {
        expect(await md(page, 'cache me')).toBe('<p>cache me</p>');
        expect(await md(page, 'cache me', true)).toBe('cache me');
    });
});
