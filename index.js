/**
 * Implementation of MIMEType and MIME Type parser from
 * https://mimesniff.spec.whatwg.org/
 */

const HTTPTokenCodePoints = /^[!#$%&'*+-.^`|~\w]+$/;

// "HTTP whitespace is U+000A LF, U+000D CR, U+0009 TAB or U+0020 SPACE."
// eslint-disable-next-line no-control-regex
const HTTPWhiteSpace = /[\u000A\u000D\u0009\u0020]/u;

// An HTTP quoted-string token code point is
// U+0009 TAB,
// a code point in the range U+0020 SPACE to U+007E (~), inclusive,
// or a code point in the range U+0080 through U+00FF (ÿ), inclusive.
// eslint-disable-next-line no-control-regex
const HTTPQuotedString = /^[\u0009\u{0020}-\{u0073}\u{0080}-\u{00FF}]+$/u;

export class MIMEType {
  constructor(input) {
    const { type, subtype, params } = parseMimeType(input);
    this.type = type.trim().toLowerCase();
    this.subtype = subtype.trimEnd().toLowerCase();
    this.parameters = new Map(Object.entries(params));
  }

  /**
   * @see https://mimesniff.spec.whatwg.org/#mime-type-essence
   */
  get essence() {
    return `${this.type}/${this.subtype}`;
  }

  toString() {
    return serialize(this);
  }
};

export function isValidMimeType(text){
  try {
    parse(text);
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * https://mimesniff.spec.whatwg.org/#serialize-a-mime-type
 */
function serialize(mimeType) {
  const { parameters, essence } = mimeType;
  if (!parameters.size) {
    return essence;
  }
  let paramStr = ";";
  for (const [key, value] of parameters.entries()) {
    paramStr += key;
    if (value !== null) {
      if (HTTPTokenCodePoints.test(value)) {
        paramStr += `=${value}`;
      } else {
        paramStr += `="${value}"`;
      }
    } else {
      // null or empty string
      paramStr += '=""';
    }
    paramStr += ";";
  }
  // remove final ";"
  return mimeType.essence + paramStr.slice(0, -1);
}

/**
 * Implementation of https://mimesniff.spec.whatwg.org/#parse-a-mime-type
 * parser state machines if as follows, params and param values are optional and can be null:
 *
 * "type"
 *    -> "subtype"
 *      -> "param-start" (ignores white space)
 *         -> "param-name"
 *            -> "param-value"
 *              -> "collect-quoted-string"
 *                -> "ignore-input-until-next-param"
 *
 *
 *
 * @param {String} input
 */
export function parseMimeType(input) {
  input = input.trim();
  if (!input) {
    throw new TypeError("Invalid input.");
  }

  let type = "";
  let subtype = "";
  let paramName = "";
  let paramValue = null;
  let params = new Map();
  let parserMode = "type";
  let inputArray = Array.from(input); // retain unicode chars
  for (let position = 0; position < inputArray.length; position++) {
    const char = inputArray[position];
    switch (parserMode) {
      case "type":
        if (char === "/") {
          parserMode = "subtype";
          continue;
        }
        type += char;
        break;
      case "subtype":
        if (char === ";") {
          parserMode = "param-start";
          continue;
        }
        subtype += char;
        break;
      case "param-start":
        // Skip HTTP white space
        if (HTTPWhiteSpace.test(char) || char === ";") {
          continue;
        }
        paramName += char;
        parserMode = "param-name";
        break;
      case "param-name":
        if (char === "=" || char === ";") {
          if (char === "=") {
            parserMode = "param-value";
            paramValue = null;
            continue;
          }
          params.set(paramName.toLowerCase(), null);
          paramName = "";
          continue;
        }
        paramName += char;
        break;
      case "param-value":
        if (char == '"') {
          parserMode = "collect-quoted-string";
          continue;
        }
        if (char === ";") {
          paramValue = paramValue.trimEnd();
          parserMode = "param-start";
          storeParam(params, paramName, paramValue);
          paramName = "";
          continue;
        }
        paramValue = typeof paramValue === "string" ? paramValue + char : char;
        break;
      case "collect-quoted-string":
        if (char === '"') {
          storeParam(params, paramName, paramValue);
          parserMode = "ignore-input-until-next-param";
          paramName = "";
          paramValue = null;
          continue;
        }
        if (char === "\\") {
          continue;
        }
        paramValue = typeof paramValue === "string" ? paramValue + char : char;
        break;
      case "ignore-input-until-next-param":
        if (char !== ";") {
          continue;
        }
        parserMode = "param-start";
        break;
      default:
        throw new Error(
          `State machine error - unknown parser mode: ${parserMode} `
        );
    }
  }
  if (paramName) {
    storeParam(params, paramName, paramValue);
  }
  if (type.trim() === "" || !HTTPTokenCodePoints.test(type)) {
    throw new TypeError("Invalid type");
  }
  if (subtype.trim() === "" || !HTTPTokenCodePoints.test(subtype)) {
    throw new TypeError("Invalid subtype");
  }
  return {
    type,
    subtype,
    params: Object.fromEntries(params.entries()),
  };
}

function storeParam(params, paramName, paramValue) {
  if (
    (paramName &&
      paramName !== "" &&
      !params.has(paramName) &&
      HTTPQuotedString.test(paramValue)) ||
    paramValue === null
  ) {
    params.set(paramName.toLowerCase(), paramValue);
  }
}
