import assert from "node:assert/strict";
import { test } from "node:test";
import { mediaUrl, youtubeVideoId } from "../assets/promotion.mjs";

test("YouTube Shorts, shared and watch links resolve to the same video", () => {
  for (const url of ["https://www.youtube.com/shorts/AbCdEf123_-?feature=share", "https://youtu.be/AbCdEf123_-?si=share", "https://www.youtube.com/watch?v=AbCdEf123_-", "https://m.youtube.com/watch?v=AbCdEf123_-"]) {
    assert.equal(youtubeVideoId(url), "AbCdEf123_-");
  }
});

test("invalid YouTube links never become embedded frames", () => {
  for (const url of ["", null, "javascript:alert(1)", "http://youtu.be/AbCdEf123_-", "https://youtube.com.evil.test/shorts/AbCdEf123_-", "https://user:pass@youtube.com/shorts/AbCdEf123_-", "https://youtu.be/too-short", "https://youtu.be/AbCdEf123_-/extra", "https://youtube.com:444/shorts/AbCdEf123_-"]) assert.equal(youtubeVideoId(url), null);
});

test("media files work under a GitHub Pages repository path and allow HTTPS hosting", () => {
  const base = "https://kkoma1212.github.io/uriban-hub-site/";
  assert.equal(mediaUrl("assets/presentation/slide-01.webp", base), `${base}assets/presentation/slide-01.webp`);
  assert.equal(mediaUrl("https://cdn.example.com/deck.pdf", base), "https://cdn.example.com/deck.pdf");
  for (const url of ["", null, {}, "javascript:alert(1)", "data:text/html,test", "file:///C:/deck.pdf", "http://other.test/deck.pdf", "https://name:password@other.test/deck.pdf"]) assert.equal(mediaUrl(url, base), null);
});
