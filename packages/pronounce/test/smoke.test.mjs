import { test } from "node:test";
import assert from "node:assert/strict";
import { useSpeech, PronounceButton } from "../dist/index.js";

test("exports useSpeech hook", () => {
  assert.equal(typeof useSpeech, "function");
});

test("exports PronounceButton component", () => {
  assert.equal(typeof PronounceButton, "function");
});
