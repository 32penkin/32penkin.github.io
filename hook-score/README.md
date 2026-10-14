# HookScore Public Pages

This folder is a standalone static site for GitHub Pages. It is intentionally kept outside `apps/mobile`.

Expected production URLs:

```text
https://32penkin.github.io/hook-score/privacy/
https://32penkin.github.io/hook-score/account-deletion/
https://32penkin.github.io/hook-score/r/?code=CODE&src=creator_code   (redeem link page)
```

Channel links: add `?src=<channel>[&cmp=<campaign>]` to the landing URL (for example
`?src=tiktok`). `assets/hookscore-links.js` passes them to Google Play as the install referrer
(`utm_source`, `utm_medium=landing`, `utm_campaign`, `hs_code`), which the app reads on first
launch. `/r/?code=CODE&src=...` opens the app with `hookscore://redeem?c=CODE` (Android Chrome
falls back to Play with the code in the referrer; iOS shows buttons and a copy button). Tests:
`node --test tools/web/hookscore-links.test.cjs`.

The workflow in `.github/workflows/deploy-docs.yml` publishes this folder with GitHub Pages. In the repository settings, configure Pages to use GitHub Actions.
