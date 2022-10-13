const { applyTheme } = require("./colorTheme");
const { clipboardListener } = require("./clipboardEventListener");
const { getKeywords } = require("./hover-highlight-element.js");
const { customJS } = require("./custom.js");

(() => {
  applyTheme();
  clipboardListener();
  getKeywords();
  customJS();
})();
