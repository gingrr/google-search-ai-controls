"use strict";

const AI_MODE_RULESET = "ai_mode_redirects";
const WEB_MODE_RULESET = "force_web_mode";

const DEFAULTS = Object.freeze({
  blockAIMode: true,
  forceWebMode: false
});

async function getManagedSettings() {
  try {
    const policy = await chrome.storage.managed.get([
      "blockAIMode",
      "forceWebMode"
    ]);

    return {
      blockAIMode:
        typeof policy.blockAIMode === "boolean"
          ? policy.blockAIMode
          : DEFAULTS.blockAIMode,
      forceWebMode:
        typeof policy.forceWebMode === "boolean"
          ? policy.forceWebMode
          : DEFAULTS.forceWebMode
    };
  } catch (error) {
    console.warn(
      "Google Search AI Controls: unable to read managed policy; using defaults.",
      error
    );
    return { ...DEFAULTS };
  }
}

async function applyManagedPolicy() {
  const settings = await getManagedSettings();

  const enableRulesetIds = [];
  const disableRulesetIds = [];

  if (settings.blockAIMode) {
    enableRulesetIds.push(AI_MODE_RULESET);
  } else {
    disableRulesetIds.push(AI_MODE_RULESET);
  }

  if (settings.forceWebMode) {
    enableRulesetIds.push(WEB_MODE_RULESET);
  } else {
    disableRulesetIds.push(WEB_MODE_RULESET);
  }

  try {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds,
      disableRulesetIds
    });
  } catch (error) {
    console.error(
      "Google Search AI Controls: unable to update declarative rulesets.",
      error
    );
  }
}

chrome.runtime.onInstalled.addListener(() => {
  void applyManagedPolicy();
});

chrome.runtime.onStartup.addListener(() => {
  void applyManagedPolicy();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "managed") {
    return;
  }

  if (
    Object.prototype.hasOwnProperty.call(changes, "blockAIMode") ||
    Object.prototype.hasOwnProperty.call(changes, "forceWebMode")
  ) {
    void applyManagedPolicy();
  }
});

void applyManagedPolicy();
