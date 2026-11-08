<webui-page-segment elevation="10">
    The `<webui-file-preview>` component shows a preview of a file, choosing the right viewer from the file's type, or from its extension when the browser gives no type. It takes files from `<webui-file-select>` through `setFile`, or loads a url from its `src` attribute.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <webui-flex column>
            <webui-file-select label="Select Files" multiple data-trigger="preview-file-data"></webui-file-select>
            <webui-file-preview height="400" details data-subscribe="preview-file-data:setFile"></webui-file-preview>
        </webui-flex>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column>
            <webui-file-select label="Select Files" multiple data-trigger="preview-file-data"></webui-file-select>
            <webui-file-preview height="400" details data-subscribe="preview-file-data:setFile"></webui-file-preview>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

### Supported Files

| Files | Preview |
|---|---|
| Images: PNG, JPEG, GIF, WebP, AVIF, SVG, BMP, ICO, APNG | Shown as an image. SVG scripts do not run. |
| Video: MP4, WebM, OGV, MOV, M4V | Plays with controls. |
| Audio: MP3, WAV, OGG, Opus, M4A, AAC, FLAC | Plays with controls. |
| PDF | Opens in the browser's PDF viewer. |
| HTML | Rendered in a sandboxed frame, so its scripts cannot run. |
| CSV and TSV | Shown as a table of the first 500 rows. |
| JSON | Formatted for reading. |
| Text, markdown, logs, config, and source code | Shown as plain text. |
| Fonts: TTF, OTF, WOFF, WOFF2 | Shown as sample text in that font. |

Support for some formats depends on the browser. Safari shows TIFF and HEIC images, which other browsers cannot, and MKV, AVI, and some MOV video only play where the browser has the codec. When a file cannot be previewed, the component shows its name, type, size, and a download link instead.

### Attributes

- **`height`:** sets the height of the preview. Images and video are scaled to fit inside it.
- **`max-height`:** limits the height without fixing it.
- **`src`:** previews a url. Text files at another site need that site to allow the request (CORS).
- **`details`:** shows the file's name, size, and a download link above the preview.

### Several Files

Given more than one file, the component shows a pagination control to move between them.

### Setting Files in Code

`setFile` takes an array or a single file. Each file can be a browser `File` or `Blob`, or an object with a `name`, a `type`, and one of these:

- **`content`:** a data url, text, or an `ArrayBuffer`.
- **`file`:** a `File` or `Blob`. `<webui-file-select>` sets this, so large videos play without decoding `content`.
- **`url`:** a link to the file.

`clear()` removes the preview.

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/file-preview.js" language="javascript" label="file-preview.js"></webui-code>
