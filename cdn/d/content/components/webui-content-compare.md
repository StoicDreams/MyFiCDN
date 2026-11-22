<webui-page-segment elevation="10">
    The `<webui-content-compare>` component shows two versions of a text side by side, the old on the left and the new on the right, with removed lines marked in red and added lines in green. Screen readers hear "Removed" or "Added" before each changed line. By default it shows only the changes, with a few lines around each; the **Show Full File** checkbox shows every line. Long texts draw in pieces, so the page stays responsive.

    Give it the two versions with `setDiff(oldLines, newLines, changeType)`. Each line is an object with `line` (its text) and, optionally, `lineNumber`, `background`, and `color` (a color or a variable such as `--color-info`). `changeType` can be `add` or `delete` to show only the new or only the old side, such as for a file that was added or deleted. `clear()` empties it.
</webui-page-segment>

```html:Code Snippet
<webui-content-compare id="file-compare" style="height:240px"></webui-content-compare>
<script>
    const toLines = text => text.split('\n').map((line, i) => ({ line, lineNumber: i + 1 }));
    customElements.whenDefined('webui-content-compare').then(() => {
        document.querySelector('#file-compare').setDiff(toLines('one\ntwo\nthree'), toLines('one\nTWO\nthree\nfour'));
    });
</script>
```

[ApTul's Diff Checker](https://www.aptul.com/diff-checker) uses it to compare two texts.

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/content-compare.js" language="javascript" label="content-compare.js"></webui-code>
