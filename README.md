sahtml
======

Fast and low memory API for HTML (node.js).

Returns HTML tokens one-by-one. Does not build DOM (Document Object Model).

Installation
------------

```
npm install sahtml
```

Usage
-----

```javascript
var SAHtml = require('sahtml').SAHtml;

var parser = new SAHtml('<!DOCTYPE html><html><head><title>Example</title></head><body><img src="/logo.png"/><a href="/">Hello World</a></body></html>'),
    token;

while ((token = parser.next()).type != 'eof') {
    console.log(token);
}
```

Produces:

```
{ type: 'doctype', value: 'html', pos: 0 }
{ type: 'tagDef', name: 'html', pos: 15 }
{ type: 'tagDefEnd', pos: 20 }
{ type: 'tagDef', name: 'head', pos: 21 }
{ type: 'tagDefEnd', pos: 26 }
{ type: 'tagDef', name: 'title', pos: 27 }
{ type: 'tagDefEnd', pos: 33 }
{ type: 'string', value: 'Example', pos: 34 }
{ type: 'tagClose', name: 'title', pos: 41 }
{ type: 'tagClose', name: 'head', pos: 49 }
{ type: 'tagDef', name: 'body', pos: 56 }
{ type: 'tagDefEnd', pos: 61 }
{ type: 'tagDef', name: 'img', pos: 62 }
{ type: 'tagAttr', name: 'src', value: '/logo.png', pos: 67 }
{ type: 'tagDefAutoEnd', pos: 82 }
{ type: 'tagDef', name: 'a', pos: 84 }
{ type: 'tagAttr', name: 'href', value: '/', pos: 87 }
{ type: 'tagDefEnd', pos: 95 }
{ type: 'string', value: 'Hello World', pos: 96 }
{ type: 'tagClose', name: 'a', pos: 107 }
{ type: 'tagClose', name: 'body', pos: 111 }
{ type: 'tagClose', name: 'html', pos: 118 }
```

Token description
-----------------

*type* may be one of:

* *tagDef* — tag definition (e.g. '<a'), token contains *name* field.
* *tagAttr* — attribute definition (e.g. 'href="/"'), token contains *name* field and may contain *value* field if attribute has a value.
* *tagDefEnd* — end of tag definition ('>').
* *tagDefAutoEnd* — auto end of tag definition ('/>').
* *tagClose* — tag close (e.g. '</a>'), token contains *name* field.
* *string* — decoded html string, contains *value* field.
* *doctype* — doctype (e.g. '<!DOCTYPE html>'), contains *value* field.
* *comment* — comment (e.g. '<!-- comment -->'), contains *value* field.
* *cdata* — XML CDATA (e.g. '<![CDATA[ example CDATA ]]>'), contains *value* field.
* *eof* — enf of file.

Every HTML token contains *pos* field, containing offset from beginning of the string to the token position.
