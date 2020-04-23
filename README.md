# MIMEType
MIME Type string parser that tries to conform to the WHATWG MIME Sniff spec.

## API 

The class consists of:

 * `constructor(string)`: takes a string representing a MIME type. This sends the string to the parser. If the string is non-conforming, it throws a `TypeError` errors. 
 * `.essense` property: the "type", "/", and "subtype" normalized to lower case. For example: "text/plain".
 * `.type`: the primary type of the string. E.g., "application", "text", or "image".   
 * `.subtype`: The subtype. So, like, "plain" in "text/plain".
 * `.parameters`: a Map consisting of the parameters that were passed, normalized per spec.  
 * `.toString()`: stringifier gives you back the MIME type in canonical form. 
 
## Examples

### Creating and parsing

```JS
import { MIMEType } from "MIMEType";

const mimetype = new MIMEType("text/html; charset=UTF-8");

// This throws
try {
  new MIMEType("not valid");
} catch (err) {
  // nice try... 
}
```

### Accessing different parts

```JS
import { MIMEType } from "MIMEType";
const mimetype = new MIMEType("text/html; charset=UTF-8");
console.log(mimetype.essense); // text/html 
console.log(mimetype.type) // text
console.log(mimetype.subtype) // html
```

### Parameters

Parameters is just a regular [JavaScript Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map), so:

```JS
import { MIMEType } from "MIMEType";
const mimetype = new MIMEType("text/html; charset=UTF-8");

mimetype.parameters.has("charset"); // true

for(const [key, value] from mimetype.parameters) {
  console.log(key, value);
}
```
