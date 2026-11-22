<webui-page-segment elevation="10">
    The `<webui-button>` component provides an interactive button element that can act as a standard click target, a form submission trigger, or a navigational link. It features built-in data manipulation capabilities, allowing it to transfer data, clear global data keys, or remove specific items from stored arrays or objects directly via HTML attributes. It also supports `start-icon` and `end-icon` integrations.

    The `icon-only` flag shows just the button's icon, and its text becomes its name, read by screen readers and shown as its tooltip. A button without an icon shows two letters of its text instead: the first letters of its first two words, such as "SK" for Security Key, or the first two letters of a single word, such as "Pr" for Projects. `webui-tabs` sets it on its tab buttons when they show as icons.
</webui-page-segment>

## Attributes

<webui-page-segment elevation="10">
    - `label`: the button's text, in place of its content.
    - `start-icon` and `end-icon`: icons before and after the text, with any of the icon's options, such as `arrow|rotate:180`. `start-icon-class` and `end-icon-class` give each icon a class.
    - `align`: `left` or `right` moves the content to that side of a button wider than it, which is centered otherwise.
    - `wrap`: lets long text wrap onto more lines instead of staying on one.
    - `href`: opens that address when pressed, making the button a link for screen readers. Paths on this site load in place, and other sites open in this tab, or in a new one with Ctrl or Cmd held. `target` opens it in another window, such as `_blank`.
    - `submit` (or `type="submit"`): submits the form the button is in.
    - `disabled`: turns the button off, so it can't be pressed or reached with the keyboard.
    - `theme` and `elevation`: its colors and its shadow, as on other components.
    - `icon-only`: shows just the icon, as described above.
    - `data-transfer="from:to"`: copies data from one key to another when pressed. With only a key, it sets that key to the button's `data-value`. Separate several with `|`.
    - `data-clear="key|other"`: clears those data keys when pressed.
    - `data-remove-item="key:index"`: removes the item at that index, or that property, from the array or object stored at the key.
</webui-page-segment>

<webui-side-by-side>
    ```html:Code Snippet
        <!-- Standard Button -->
        <webui-button theme="primary">Primary Button</webui-button>

        <!-- Button with Icons -->
        <webui-button theme="success" start-icon="arrow|rotate:180" end-icon="arrow">With Icons</webui-button>

        <!-- Navigational Link Button -->
        <webui-button theme="info" href="/about">Go to About</webui-button>

        <!-- Data Manipulation (Clear Data) -->
        <webui-button theme="danger" data-clear="session-temp-data">Clear Data</webui-button>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column>
            <webui-button theme="primary">Primary Button</webui-button>
            <webui-button theme="success" start-icon="arrow|rotate:180" end-icon="arrow">With Icons</webui-button>
            <webui-button theme="info" href="/about">Go to About</webui-button>
            <webui-button theme="danger" data-clear="session-temp-data">Clear Data</webui-button>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

<webui-side-by-side>
    ```html:Code Snippet
        <!-- Text set by label, pushed to the left of a wide button -->
        <webui-button theme="secondary" label="Left Aligned" align="left" start-icon="gear" class="w-fill"></webui-button>

        <!-- Icon only: the text names the button and shows as its tooltip -->
        <webui-button theme="tertiary" start-icon="star" icon-only>Favorite</webui-button>

        <!-- Opens another site in a new window -->
        <webui-button theme="info" href="https://www.stoicdreams.com" target="_blank" end-icon="arrow" elevation="3">Stoic Dreams</webui-button>

        <!-- Copies one data key to another, then removes the first item of a list -->
        <webui-button data-transfer="demo-button-from:demo-button-to">Copy Data</webui-button>
        <webui-button data-remove-item="demo-button-list:0">Remove First Item</webui-button>

        <!-- Turned off -->
        <webui-button disabled>Disabled</webui-button>
    ```
    <webui-page-segment elevation="10">
        <webui-flex column>
            <webui-button theme="secondary" label="Left Aligned" align="left" start-icon="gear" class="w-fill"></webui-button>
            <webui-button theme="tertiary" start-icon="star" icon-only>Favorite</webui-button>
            <webui-button theme="info" href="https://www.stoicdreams.com" target="_blank" end-icon="arrow" elevation="3">Stoic Dreams</webui-button>
            <webui-button data-transfer="demo-button-from:demo-button-to">Copy Data</webui-button>
            <webui-button data-remove-item="demo-button-list:0">Remove First Item</webui-button>
            <webui-button disabled>Disabled</webui-button>
        </webui-flex>
    </webui-page-segment>
</webui-side-by-side>

<webui-side-by-side>
    ```html:Code Snippet
        <form onsubmit="event.preventDefault(); webui.alert('Submitted', 'success');">
            <webui-input-text label="Name" name="name"></webui-input-text>
            <webui-button theme="primary" submit>Submit</webui-button>
        </form>
    ```
    <webui-page-segment elevation="10">
        <form onsubmit="event.preventDefault(); webui.alert('Submitted', 'success');">
            <webui-input-text label="Name" name="name"></webui-input-text>
            <webui-button theme="primary" submit>Submit</webui-button>
        </form>
    </webui-page-segment>
</webui-side-by-side>

### Source Code

<webui-code src="https://cdn.myfi.ws/webui/button.js" language="javascript" label="button.js"></webui-code>
