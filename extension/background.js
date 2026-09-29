"use strict";

const AI_MODE_RULESET = "ai_mode_redirects";
const DEFAULT_BLOCK_AI_MODE = true;

async function getBlockAIModeSetting() {
  try {
    const policy = await chrome.storage.managed.get(["blockAIMode"]);
    return typeof policy.blockAIMode === "boolean"
      ? policy.blockAIMode
      : DEFAULT_BLOCK_AI_MODE;
  } catch (error) {
    console.warn(
      "Google Search AI Controls: unable to read managed policy; using default.",
      error
    );
    return DEFAULT_BLOCK_AI_MODE;
  }
}

async function applyManagedPolicy() {
  const blockAIMode = await getBlockAIModeSetting();

  try {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: blockAIMode ? [AI_MODE_RULESET] : [],
      disableRulesetIds: blockAIMode ? [] : [AI_MODE_RULESET]
    });
  } catch (error) {
    console.error(
      "Google Search AI Controls: unable to update AI Mode redirect rules.",
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
  if (
    areaName === "managed" &&
    Object.prototype.hasOwnProperty.call(changes, "blockAIMode")
  ) {
    void applyManagedPolicy();
  }
});

void applyManagedPolicy();
