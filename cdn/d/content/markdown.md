# Web UI Markdown Cheat Sheet

Web UI is designed to use a tweaked version of Markdown when loading site content.

This Markdown cheat sheet provides a quick overview of all the syntax elements supported by Web UI Markdown.

## Headings

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown:Example Code
# H1
## H2
### H3
#### H4
##### H5
###### H6
### Heading with an id {#my-id}
```
</webui-page-segment>
<webui-page-segment elevation="10">
# H1
## H2
### H3
#### H4
##### H5
###### H6
### Heading with an id {#my-id}
</webui-page-segment>
</webui-side-by-side>

<script type="text/javascript">console.log('hello world')</script>
## Emphasis

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown:Example Code
*Italic* or _Italic_
**Bold** or __Bold__
***Bold and Italic***
```
</webui-page-segment>
<webui-page-segment elevation="10">
*Italic* or _Italic_
**Bold** or __Bold__
***Bold and Italic***
</webui-page-segment>
</webui-side-by-side>

## More Formatting

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown:Example Code
~~Strikethrough~~
==Highlight==
x^2^ for superscript
H~2~O for subscript
```
</webui-page-segment>
<webui-page-segment elevation="10">
~~Strikethrough~~
==Highlight==
x^2^ for superscript
H~2~O for subscript
</webui-page-segment>
</webui-side-by-side>

## Blockquotes

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown:Example Code
Before blockquote
> This is a blockquote.
>> Nested blockquote.
>> Continue Nested
>>> [This is a cite] More Nested with cite
> Back to parent
After blockquote
```

```markdown:With Themes
Before blockquote
> [success] This is a blockquote.
>> [warning] Nested blockquote.
>> Continue Nested
>>> [danger:This is a cite] More Nested with cite
> Back to parent
After blockquote
```
</webui-page-segment>
<webui-page-segment elevation="10">
Before blockquote
> This is a blockquote.
>> Nested blockquote.
>> Continue Nested
>>> [This is a cite] More Nested with cite
> Back to parent
After blockquote

Before blockquote
> [success] This is a blockquote.
>> [warning] Nested blockquote.
>> Continue Nested
>>> [danger:This is a cite] More Nested with cite
> Back to parent
After blockquote
</webui-page-segment>
</webui-side-by-side>

## Lists

### Unordered

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown:Example Code
- Item 1
- Item 2
  - Item 2a
  - Item 2b
    - Item 2ai
    - Item 2bii
- Item 3
```
</webui-page-segment>
<webui-page-segment elevation="10">
- Item 1
- Item 2
  - Item 2a
  - Item 2b
    - Item 2ai
    - Item 2bii
- Item 3
</webui-page-segment>
</webui-side-by-side>

### Ordered

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown:Example Code
1. Item 1
1. Item 2
  1. Item 2a
  2. Item 2b
    1. Item 2ai
    1. Item 2bii
2. Item 3
```
</webui-page-segment>
<webui-page-segment elevation="10">
1. Item 1
2. Item 2
  1. Item 2a
  2. Item 2b
    1. Item 2ai
    1. Item 2bii
3. Item 3
</webui-page-segment>
</webui-side-by-side>

### Mixed

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown:Example Code
1. Item 1
2. Item 2
  - Item 2a
  - Item 2b
    1. Item 2ai
    1. Item 2bii

- Item 1
- Item 2
  1. Item 2a
  1. Item 2b
    - Item 2ai
    - Item 2bii
```
</webui-page-segment>
<webui-page-segment elevation="10">
1. Item 1
2. Item 2
  - Item 2a
  - Item 2b
    1. Item 2ai
    1. Item 2bii

- Item 1
- Item 2
  1. Item 2a
  1. Item 2b
    - Item 2ai
    - Item 2bii
</webui-page-segment>
</webui-side-by-side>

### Starting Number

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown:Example Code
3. Lists start at their first number
4. Items can also use 1) instead of 1.

+ Bullets can use -, *, or +

+ Blank lines between items keep one list
  Indented text continues the item above it
```
</webui-page-segment>
<webui-page-segment elevation="10">
3. Lists start at their first number
4. Items can also use 1) instead of 1.

+ Bullets can use -, *, or +

+ Blank lines between items keep one list
  Indented text continues the item above it
</webui-page-segment>
</webui-side-by-side>

## Definitions

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown:Example Code
Term
: The definition of the term
: A second definition
Another Term
: Its definition
```
</webui-page-segment>
<webui-page-segment elevation="10">
Term
: The definition of the term
: A second definition
Another Term
: Its definition
</webui-page-segment>
</webui-side-by-side>

## Code

### Inline

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown:Example Code
Use `code` inside text.
Use <span theme="warning">`code`</span> inside text.
Use `danger:code` inside text.
```
</webui-page-segment>
<webui-page-segment elevation="10">
Use `code` inside text.
Use <span theme="warning">`code`</span> inside text.
Use `danger:code` inside text.
</webui-page-segment>
</webui-side-by-side>

### Block

<webui-side-by-side>
<webui-page-segment elevation="10">
````markdown:Example Code
```javascript:Code Label
function test() {
  console.log("Hello world!");
}
```
````
</webui-page-segment>
<webui-page-segment elevation="10">
```javascript:Code Label
function test() {
  console.log("Hello world!");
}
```
</webui-page-segment>
</webui-side-by-side>

Code blocks can also start and end with `~~~`, which lets them show ``` inside.

## Horizontal Rule

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown:Example Code
---
***
- - -
---success
---danger
---warning
```
</webui-page-segment>
<webui-page-segment elevation="10">
---
***
- - -
---success
---danger
---warning
</webui-page-segment>
</webui-side-by-side>

## Links

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown:Example Code
[Text](https://cdn.myfi.ws)
[Text with title](https://cdn.myfi.ws "Title")
<https://cdn.myfi.ws> and <support@stoicdreams.com>
Bare links such as https://cdn.myfi.ws work too.
[Reference link][cdn], [another][], or just [cdn]

[cdn]: https://cdn.myfi.ws "Web UI CDN"
[another]: https://webui.stoicdreams.com
```
</webui-page-segment>
<webui-page-segment elevation="10">
[Text](https://cdn.myfi.ws)
[Text with title](https://cdn.myfi.ws "Title")
<https://cdn.myfi.ws> and <support@stoicdreams.com>
Bare links such as https://cdn.myfi.ws work too.
[Reference link][cdn], [another][], or just [cdn]

[cdn]: https://cdn.myfi.ws "Web UI CDN"
[another]: https://webui.stoicdreams.com
</webui-page-segment>
</webui-side-by-side>

## Images

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown:Example Code
![Alt text](https://cdn.myfi.ws/ms-icon-310x310.png)
![Alt text with title](https://cdn.myfi.ws/ms-icon-310x310.png "Title")
```
</webui-page-segment>
<webui-page-segment elevation="10">
![Alt text](https://cdn.myfi.ws/ms-icon-310x310.png)
![Alt text with title](https://cdn.myfi.ws/ms-icon-310x310.png "Title")
</webui-page-segment>
</webui-side-by-side>

## Tables

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown:Example Code
| Header 1 | Header 2 | H-Left | H-Center | H-Right |
|----------|----------|:-------|:--------:|--------:|
| Cell 1   | Cell 2   | Cell 3 | Cell 4   | Cell 5  |
| Cell 6   | Cell 7   | Cell 8 | Cell 9   | Cell 10 |
```

```markdown:Without wrapping pipes
Header 1 | Header 2 | H-Left | H-Center | H-Right
---------|----------|:-------|:--------:|--------:
Cell 1   | Cell 2   | Cell 3 | Cell 4   | Cell 5
Cell 6   | Cell 7   | Cell 8 | Cell 9   | Cell 10
```
</webui-page-segment>
<webui-page-segment elevation="10">
| Header 1 | Header 2 | H-Left | H-Center | H-Right |
|----------|----------|:-------|:--------:|--------:|
| Cell 1   | Cell 2   | Cell 3 | Cell 4   | Cell 5  |
| Cell 6   | Cell 7   | Cell 8 | Cell 9   | Cell 10 |

Header 1 | Header 2 | H-Left | H-Center | H-Right
---------|----------|:-------|:--------:|--------:
Cell 1   | Cell 2   | Cell 3 | Cell 4   | Cell 5
Cell 6   | Cell 7   | Cell 8 | Cell 9   | Cell 10
</webui-page-segment>
</webui-side-by-side>

## Task Lists

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown:Example Code
- [x] Task 1
- [ ] Task 2
- [ ] Task 3
1. [x] Numbered tasks work too
```
</webui-page-segment>
<webui-page-segment elevation="10">
- [x] Task 1
- [ ] Task 2
- [ ] Task 3
1. [x] Numbered tasks work too
</webui-page-segment>
</webui-side-by-side>

## Footnotes

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown:Example Code
A claim that needs a source.[^source]
Another note.[^2]

[^source]: Footnotes are numbered in the order they are used, and listed at the end of the page.
[^2]: Select ↩ to return to the text.
```
</webui-page-segment>
<webui-page-segment elevation="10">
A claim that needs a source.[^source]
Another note.[^2]

[^source]: Footnotes are numbered in the order they are used, and listed at the end of the page.
[^2]: Select ↩ to return to the text.
</webui-page-segment>
</webui-side-by-side>

## Escaping Characters

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown:Example Code
\*literal asterisks\*
\| \~ \= \^ \< \> \: and other markdown characters
```
</webui-page-segment>
<webui-page-segment elevation="10">
\*literal asterisks\*
\| \~ \= \^ \< \> \: and other markdown characters
</webui-page-segment>
</webui-side-by-side>

## HTML in Markdown

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown:Example Code
<p>This is a paragraph with <strong>HTML</strong> formatting.</p>
```
</webui-page-segment>
<webui-page-segment elevation="10">
<p>This is a paragraph with <strong>HTML</strong> formatting.</p>
</webui-page-segment>
</webui-side-by-side>

## Emojis

<webui-side-by-side>
<webui-page-segment elevation="10">
```markdown:Example Code
:100: :+1: :-1: :angel: :scream: :trumpet:
```
</webui-page-segment>
<webui-page-segment elevation="10">
:100: :+1: :-1: :angel: :scream: :trumpet:
</webui-page-segment>
</webui-side-by-side>
