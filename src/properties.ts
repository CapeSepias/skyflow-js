export const properties = {
  IFRAME_SECURE_SITE:
    process.env.IFRAME_SECURE_SITE || "http://localhost:3040/iframe.html",
  VERSION: process.env.npm_package_version || "0.1.1",
};