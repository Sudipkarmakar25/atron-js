import test from "node:test";
import assert from "node:assert/strict";
import { capitalize, reverse, isEmpty } from "../src/index";

test("capitalize handles various inputs", () => {
  const cases: Array<[string, string]> = [
    ["", ""],
    ["a", "A"],
    ["hello", "Hello"],
    ["Hello", "Hello"],
    ["hELLO", "HELLO"],
    [" hello", " hello"], // leading space should remain unchanged
    ["123abc", "123abc"],
    ["ümlaut", "Ümlaut"],
    [" multiple words", " multiple words"],
    ["already Capitalized", "Already Capitalized"],
  ];

  for (const [input, expected] of cases) {
    assert.equal(
      capitalize(input),
      expected,
      `capitalize(${JSON.stringify(input)}) should be ${JSON.stringify(expected)}`
    );
  }
});

test("reverse reverses many different strings", () => {
  const cases: Array<[string, string]> = [
    ["", ""],
    ["a", "a"],
    ["ab", "ba"],
    ["abc", "cba"],
    ["racecar", "racecar"],
    ["hello world", "dlrow olleh"],
    ["  spaced", "decaps  "],
    ["12345", "54321"],
    ["abc 123", "321 cba"],
    ["😀👍", "👍😀"],
  ];

  for (const [input, expected] of cases) {
    assert.equal(
      reverse(input),
      expected,
      `reverse(${JSON.stringify(input)}) should be ${JSON.stringify(expected)}`
    );
  }
});

test("isEmpty detects empty and non-empty strings", () => {
  const cases: Array<[string, boolean]> = [
    ["", true],
    [" ", true],
    ["   ", true],
    ["\t", true],
    ["\n", true],
    [" \n\t ", true],
    ["hello", false],
    [" hello ", false],
    ["0", false],
    ["a b", false],
    ["   a   ", false],
  ];

  for (const [input, expected] of cases) {
    assert.equal(
      isEmpty(input),
      expected,
      `isEmpty(${JSON.stringify(input)}) should be ${expected}`
    );
  }
});
