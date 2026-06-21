const nameTarget = document.querySelector("[data-thanks-name]");

if (nameTarget) {
  let storedName = "";

  try {
    storedName = sessionStorage.getItem("ekmLeadName") || "";
    sessionStorage.removeItem("ekmLeadName");
  } catch {
    storedName = "";
  }

  const firstName = storedName.trim().split(/\s+/)[0] || "";
  nameTarget.textContent = firstName ? `, ${firstName}` : "";
}

const shortWords = "(?:для|при|без|под|над|из|за|на|не|но|об|от|по|со|во|до|а|в|и|к|о|с|у)";
const shortWordPattern = new RegExp(
  `(^|[\\s\\u00A0(\\[«„\"—–-])(${shortWords})[\\t ]+(?=[А-Яа-яЁёA-Za-z0-9«„\"])`,
  "gim"
);
const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
const textNodes = [];

while (textWalker.nextNode()) {
  const node = textWalker.currentNode;
  const parent = node.parentElement;
  if (!parent || parent.closest("script, style")) continue;
  textNodes.push(node);
}

textNodes.forEach((node) => {
  node.nodeValue = node.nodeValue.replace(shortWordPattern, "$1$2\u00A0");
});
