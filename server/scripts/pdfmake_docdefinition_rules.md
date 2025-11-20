// pdfmake Tutorial (note it uses createPdf() method only available client-side in browser):
//    https://www.npmjs.com/package/@leantechniques/pdfmake
// server side pdfmake official docs: https://pdfmake.github.io/docs/0.1/getting-started/server-side/
// **pdfmake docdefinition docs: https://pdfmake.github.io/docs/0.1/document-definition-object/ **
// live playground pdfmake: http://pdfmake.org/playground.html

```javascript
var docDefinition = { content: 'This is an sample PDF printed with pdfMake' };    // { content: String }
// { content: Array of String (plain text, no styling) / dict with styling {text: "something", fontSize: 15 } }
// global styling: { content: ..., styles: ... } (can also set defaultStyle: ... instead)

// default is vertical stacking, for horizontal stacking do:
{ content: { text: [text_block_1 , text_block_2 ...]}}   // inline horizontal styling (for text)
{ content: { columns: [...], columnGap: 10 }}   // OR in general

// table example: { content: }
var docDefinition = {
  content: [
    {
      layout: 'lightHorizontalLines', // optional
      table: {
        // headers are automatically repeated if the table spans over multiple pages
        // you can declare how many rows should be treated as headers
        headerRows: 1,
        widths: [ '*', 'auto', 100, '*' ],

        body: [
          [ 'First', 'Second', 'Third', 'The last one' ],
          [ 'Value 1', 'Value 2', 'Value 3', 'Value 4' ],
          [ { text: 'Bold value', bold: true }, 'Val 2', 'Val 3', 'Val 4' ]
        ]
      }
    }
  ]
};
```

margin specification (https://pdfmake.github.io/docs/0.1/document-definition-object/margins/):

```javascript
// margin: [left, top, right, bottom]
{ text: 'sample', margin: [ 5, 2, 10, 20 ] },

// margin: [horizontal, vertical]
{ text: 'another text', margin: [5, 2] },

// margin: equalLeftTopRightBottom
{ text: 'last one', margin: 5 }

// single-side margins
{ text: 'sample', marginLeft: 5, marginTop: 2, marginRight: 10, marginBottom: 2 },
```

Style Properties:


    font: string: name of the font
    fontSize: number: size of the font in pt
    fontFeatures: string[]: array of advanced typographic features supported in TTF fonts (supported features depend on font file)
    lineHeight: number: the line height (default: 1)
    bold: boolean: whether to use bold text (default: false)
    italics: boolean: whether to use italic text (default: false)
    alignment: string: (‘left’ or ‘center’ or ‘right’ or ‘justify’) the alignment of the text
    characterSpacing: number: size of the letter spacing in pt
    color: string: the color of the text (color name e.g., ‘blue’ or hexadecimal color e.g., ‘#ff5500’)
    background: string the background color of the text
    markerColor: string: the color of the bullets in a buletted list
    decoration: string | string[]: the text decoration to apply (‘underline’ or ‘lineThrough’ or ‘overline’)
    decorationStyle: string: the style of the text decoration (‘dashed’ or ‘dotted’ or ‘double’ or ‘wavy’)
    decorationColor: string: the color of the text decoration, see color
