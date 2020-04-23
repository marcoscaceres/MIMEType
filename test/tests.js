import { MIMEType } from "../index.js";
import assert from "assert";

describe("MIMEType", () => {
  it("throws when given invalid MIME Types", () => {
    // errors on invalid types
    const invalidTypes = [
      "",
      " ",
      "/",
      "/;",
      "/;=",
      " /",
      "/ ",
      "/;c=d",
      " / ; = ",
      " / ;",
      " / ; = ",
      " / ;c=d",
      "\u000A\u000D\u0009\u0020",
      "\u000A\u000D\u0009\u0020/\u000A\u000D\u0009\u0020;\u000A\u000D\u0009\u0020",
      "\u000A\u000D\u0009\u0020/\u000A\u000D\u0009\u0020",
      "a\u000A\u000D\u0009\u0020/b",
      "a\u000A\u000D\u0009\u0020/b\u000A\u000D\u0009\u0020",
      "\u000A\u000D\u0009\u0020a/\u000A\u000D\u0009\u0020b",
      "\u000A\u000D\u0009\u0020/b",
      "💥/",
      "💥/💥",
      "a💥/b",
      "a/b💥",
      "💥a/b",
      "💥a/b💥",
      "/b",
      "\t \n/b",
    ];
    for (let i = 0; i < invalidTypes.length; i++) {
      const invalidType = invalidTypes[i];
      assert.throws(
        () => {
          new MIMEType(invalidType);
        },
        TypeError,
        `Expected mimetype at ${i} to throw`
      );
    }
  });

  it("performs subtype normalization", () => {
    const typesToNormalize = [
      ["A/b", "a/b", "a", "b"],
      ["a/B", "a/b", "a", "b"],
      ["A/B", "a/b", "a", "b"],
      ["\tA/b", "a/b", "a", "b"],
      // Trim start whitespace
      [
        "\u000A\u000DTYpe/suBTypE\u000A\u000D\u0009\u0020",
        "type/subtype",
        "type",
        "subtype",
      ],
    ];
    for (const testValue of typesToNormalize) {
      const [input, expectedEssence, expectedType, expectedSubtype] = testValue;
      const { essence, type, subtype } = new MIMEType(input);

      assert.equal(
        essence,
        expectedEssence,
        `Expected essence ${expectedEssence}, but got: "${essence}"`
      );

      assert.equal(
        type,
        expectedType,
        `Expected type ${expectedType}, but got: "${type}"`
      );

      assert.equal(
        subtype,
        expectedSubtype,
        `Expected subtype ${expectedSubtype}, but got: "${subtype}"`
      );
    }
  });

  it("correctly parses parameters", () => {
    const params = [
      ["a/b;", "a/b"],
      ["a/b;c", 'a/b;c=""'],
      ["a/b;c=", 'a/b;c=""'],
      ["a/b;c= ", 'a/b;c=""'],
      ["a/b;;;;;;;;;;;;;;;;;;;;;;;;;;;", "a/b"],
      ["a/b;;;;;;;;;;;;;;C=D;;;;;;;;;;;;;", "a/b;c=D"],
      ["a/b;;;;;;;;;;;;;;C=D;;;;;;e=quote me;;;;;;;", 'a/b;c=D;e="quote me"'],
      ["a/b;c=d;e=f", "a/b;c=d;e=f"],
      ["a/b;c=this is quoted;e=f", 'a/b;c="this is quoted";e=f'],
      ["a/b;c=d;e;f=g", 'a/b;c=d;e="";f=g'],
      ['a/b;c="🤪";d=🤪', "a/b"],
      ['a/b;c="this is ok"', 'a/b;c="this is ok"'],
      [
        'text/html;charset="shift_jis"iso-2022-jp',
        "text/html;charset=shift_jis",
      ],
      [
        'text/html;charset="shift_jis"GARBAGE;test=pass;a="b"GARBAGE',
        "text/html;charset=shift_jis;test=pass;a=b",
      ],
      ["a/b; c=d", "a/b;c=d"],
      ["a/b; c=this is quoted", 'a/b;c="this is quoted"'],
      ["a/b; c=this is quoted; x=y;", 'a/b;c="this is quoted";x=y'],
    ];
    for (const [input, expected] of params) {
      const actual = new MIMEType(input).toString();
      assert.equal(actual, expected, "Parameter name or value incorrect");
    }
  });
});
