import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidReferralCode,
  normalizeReferralCode,
  referralCodeFromName,
  referralShareText,
} from "./referrals.ts";

test("normalizes referral codes for URLs and display", () => {
  assert.equal(normalizeReferralCode(" brian reads!! "), "BRIAN-READS");
  assert.equal(normalizeReferralCode("---a b__c---"), "A-B-C");
  assert.equal(normalizeReferralCode(`${"a".repeat(31)} !!!`), "A".repeat(31));
});

test("validates referral code shape", () => {
  assert.equal(isValidReferralCode("BRIAN-READS"), true);
  assert.equal(isValidReferralCode("abc"), false);
  assert.equal(isValidReferralCode("////"), false);
});

test("builds stable display codes from names", () => {
  assert.equal(referralCodeFromName("Brian Tan", "12345678-aaaa-bbbb-cccc-eeeeeeeeeeee"), "BRIAN-12345");
  assert.equal(referralCodeFromName("", "abcde"), "READER-ABCDE");
});

test("share text includes the normalized code and brand", () => {
  assert.equal(
    referralShareText("brian reads"),
    "I made a tiny reading room in Marginalia & Co. Use code BRIAN-READS and the Librarian will start your first shelf.",
  );
});
