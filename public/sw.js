if (!self.define) {
  let e,
    s = {};
  const t = (t, i) => (
    (t = new URL(t + ".js", i).href),
    s[t] ||
      new Promise((s) => {
        if ("document" in self) {
          const e = document.createElement("script");
          (e.src = t), (e.onload = s), document.head.appendChild(e);
        } else (e = t), importScripts(t), s();
      }).then(() => {
        let e = s[t];
        if (!e) throw new Error(`Module ${t} didn’t register its module`);
        return e;
      })
  );
  self.define = (i, a) => {
    const c =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (s[c]) return;
    let n = {};
    const r = (e) => t(e, c),
      o = { module: { uri: c }, exports: n, require: r };
    s[c] = Promise.all(i.map((e) => o[e] || r(e))).then((e) => (a(...e), n));
  };
}
define(["./workbox-db63acfa"], function (e) {
  "use strict";
  importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: "/_next/app-build-manifest.json",
          revision: "1421c0eecbcef0b579234622731214fc",
        },
        {
          url: "/_next/static/FLoNJxk1JJFtq1-SZWSvz/_buildManifest.js",
          revision: "cf5e3c7102df24f3d5eb2429542b8870",
        },
        {
          url: "/_next/static/FLoNJxk1JJFtq1-SZWSvz/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/chunks/1117.7d093d42b5dba91d.js",
          revision: "7d093d42b5dba91d",
        },
        {
          url: "/_next/static/chunks/1580-e76816b4f55d86ae.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/2022-f90d7e9797d4b600.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/2163-90ea70bddae623b4.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/2668-5a38a7f4f54beceb.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/326-40b73dccd12201ae.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/3629-39a04024d9a860e3.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/4327-22dce1fd66bbcdd3.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/4523-5938f7d5774ff3ae.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/4740.83652b1f669c513f.js",
          revision: "83652b1f669c513f",
        },
        {
          url: "/_next/static/chunks/500-010234a2dd43f85a.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/5767-cfd6d1e649534991.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/6020-18351adf14818fe6.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/6508-b44f02ca3131ce70.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/6625-ef27e11fdf2ff4c6.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/7133-73349417fcc35ef8.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/7422-1f86d86fcbad918a.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/7446-192b16b409aa1913.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/7465-5a432d07dfdbe3b7.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/7550-6e893dba7f231cba.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/8575-975116eeb2cac016.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/8733-066b8dcc07a189ec.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/8876-c56c224e79897e93.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/9686-4f63e14e65f4fbea.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/9993-7422966d74c74fd8.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/a4a98a52-d08e14e411d997a1.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/(auth)/forgot-password/page-e7cd917455c1cd44.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/(auth)/layout-d450ece4c3d07ff3.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/(auth)/login/page-caf555e6564393ac.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/(auth)/register/page-1d30a6ee4de8ac75.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/(auth)/reset-password/page-6bf1baa6f3d6d80c.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/(auth)/verify-email/page-08bdd3776810ef89.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/files/page-368a789cee59aba8.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/layout-81a46a6aa82d8191.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/rbac/page-63b5190027690ce4.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/settings/page-2fc65fe8c802fa44.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/shares/page-84c3adc9ebdcf115.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/storage/page-feb4cc7a4a9e433d.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/(dashboard)/users/page-6007f609064907bc.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-d6246a47291140e1.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/auth/forgot-password/route-22f215747ca32888.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/auth/login/route-0f39566b9c82f61f.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/auth/logout/route-1456554b48728e34.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/auth/me/route-15e2e98f076df5f0.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/auth/register/route-b68cc425d1881665.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/auth/resend-code/route-010f288f3d3b58c2.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/auth/reset-password/route-433ff14c2de8bf94.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/auth/verify-email/route-3e05245182b222a4.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/files/%5Bid%5D/copy/route-74e959e06041ac88.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/files/%5Bid%5D/download/route-de21e67d61355991.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/files/%5Bid%5D/move/route-b7049610bb60fc62.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/files/%5Bid%5D/route-b3779afe4692543d.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/files/%5Bid%5D/serve/route-7e29756999069c88.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/files/%5Bid%5D/share/route-c41c8b84ea668693.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/files/batch-delete/route-bbbbf83e59d950a0.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/files/route-72b1d9d3b5a19896.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/files/upload/route-765f6558e1c607cf.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/folders/%5Bid%5D/copy/route-411e64c07f2f7b82.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/folders/%5Bid%5D/download/route-5b521566dd2b622b.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/folders/%5Bid%5D/move/route-4fda1a7dea9d1678.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/folders/%5Bid%5D/route-f0f820b6a33cbe43.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/folders/route-48cb492cf7c9a975.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/rbac/assign/route-ce4a841e02783e9e.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/rbac/logs/route-18fff735ce974bd9.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/rbac/permissions/route-9c8db4b5c0730b86.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/rbac/roles/route-64c4356b4daf6871.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/settings/password/route-098d58328f0a4da9.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/settings/profile/route-1aed2af4e7dddf5b.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/shares/%5Btoken%5D/contents/route-f0f41d9e24b2ab7f.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/shares/%5Btoken%5D/download/route-f9310188548e9a85.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/shares/%5Btoken%5D/route-fcb648c7cdeae910.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/shares/%5Btoken%5D/verify/route-8a23c1f9863cbe05.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/shares/%5Btoken%5D/view/route-b626330210984e3b.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/shares/create/route-dd7390696e717d05.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/shares/delete/%5Bid%5D/route-7fcd8ff95a578f3c.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/shares/route-36fb1456c3f714d0.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/storage-sources/%5Bid%5D/route-c460b78a7cb463be.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/storage-sources/%5Bid%5D/test/route-d1c1fc12b49f9587.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/storage-sources/route-f9172bfe5601b05a.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/storage-sources/test/route-c6abe4c5fcb2129d.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/users/%5Bid%5D/route-d18af3f64bf0da43.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/users/batch-delete/route-d59f558116262fe3.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/api/users/route-d1b2c46061a26297.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/error-ebf83bd626273e73.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/layout-10215e5a34a3f335.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/page-3dbb01bae227c5d8.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/app/s/%5Btoken%5D/page-07c1c3d26a31032d.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/framework-f2abd9fce659bef8.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/main-app-7fd16de23a9ed860.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/main-e5b151b1ad7a29a4.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/pages/_app-1b228f5a8c35005e.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/pages/_error-7fbadf7ebe914578.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-1d9c49df0cab814e.js",
          revision: "FLoNJxk1JJFtq1-SZWSvz",
        },
        {
          url: "/_next/static/css/434c974d069a239a.css",
          revision: "434c974d069a239a",
        },
        {
          url: "/_next/static/css/9105980065679743.css",
          revision: "9105980065679743",
        },
        {
          url: "/_next/static/media/046b90749014f852-s.woff2",
          revision: "19bf2a23f7f672153135a9d1918f6f9a",
        },
        {
          url: "/_next/static/media/19cfc7226ec3afaa-s.woff2",
          revision: "9dda5cfc9a46f256d0e131bb535e46f8",
        },
        {
          url: "/_next/static/media/21350d82a1f187e9-s.woff2",
          revision: "4e2553027f1d60eff32898367dd4d541",
        },
        {
          url: "/_next/static/media/3703c28dcda155b1-s.p.woff2",
          revision: "913e693f5c2ab3326efdef602387df9d",
        },
        {
          url: "/_next/static/media/67110d8fe39c5e84-s.woff2",
          revision: "91c073ec3046c2fc252900a89b6fc5d0",
        },
        {
          url: "/_next/static/media/6aacc40b7795b725-s.woff2",
          revision: "48e07fe2ca9c3bc32d09affb2ace8844",
        },
        {
          url: "/_next/static/media/8e9860b6e62d6359-s.woff2",
          revision: "01ba6c2a184b8cba08b0d57167664d75",
        },
        {
          url: "/_next/static/media/999e639cd9d85971-s.woff2",
          revision: "59533f46ae2b6e4fed5c133c03ea0608",
        },
        {
          url: "/_next/static/media/9af6411484c7e20a-s.woff2",
          revision: "5b05a416e63edb75425ca60ded1ac018",
        },
        {
          url: "/_next/static/media/ba9851c3c22cd980-s.woff2",
          revision: "9e494903d6b0ffec1a1e14d34427d44d",
        },
        {
          url: "/_next/static/media/c5fe6dc8356a8c31-s.woff2",
          revision: "027a89e9ab733a145db70f09b8a18b42",
        },
        {
          url: "/_next/static/media/df0a9ae256c0569c-s.woff2",
          revision: "d54db44de5ccb18886ece2fda72bdfe0",
        },
        {
          url: "/_next/static/media/e4af272ccee01ff0-s.p.woff2",
          revision: "65850a373e258f1c897a2b3d75eb74de",
        },
        {
          url: "/_next/static/media/e6b5cfd5a74e1cae-s.woff2",
          revision: "8358e3d9b140dd03a59878681e98a5e4",
        },
        { url: "/favicon.ico", revision: "e042547f76fddf71cd013132fcbeceee" },
        {
          url: "/icons/icon-1024x1024.png",
          revision: "ff3a0e0e619591910cf15495993b8b3e",
        },
        {
          url: "/icons/icon-128x128.png",
          revision: "e6235151d7313f7e9e3f2b1e811ef769",
        },
        {
          url: "/icons/icon-16x16.png",
          revision: "4f3c6f7154ceb234ff805874f558b28e",
        },
        {
          url: "/icons/icon-256x256.png",
          revision: "1788fd3295104ea6865a4d02a16db5eb",
        },
        {
          url: "/icons/icon-32x32.png",
          revision: "28b5afeb5018ce3c3c5d8aa76b22484a",
        },
        {
          url: "/icons/icon-512x512.png",
          revision: "103b4d15fc058b1a420f10da423ee7e4",
        },
        {
          url: "/icons/icon-64x64.png",
          revision: "c6d3cb4501c10b255200de50bcc4ec36",
        },
        {
          url: "/icons/icon.svg",
          revision: "a13417949d80d13063d90e8dae0b2e82",
        },
        { url: "/manifest.json", revision: "21002c2da98184cfd940fe92c097e887" },
      ],
      { ignoreURLParametersMatching: [] },
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({
              request: e,
              response: s,
              event: t,
              state: i,
            }) =>
              s && "opaqueredirect" === s.type
                ? new Response(s.body, {
                    status: 200,
                    statusText: "OK",
                    headers: s.headers,
                  })
                : s,
          },
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https?.*/,
      new e.NetworkFirst({
        cacheName: "offlineCache",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    );
});
