function update_prompt(prompt) {
  console.log(`Sending prompt {prompt} to ProseMirror editor.`);
  const editorElement = document.getElementById('prompt-textarea');
  console.log(editorElement);
  if (!editorElement) {
    console.error("ProseMirror editor not found.");
    return;
  }

  editorElement.focus();

  // Create a new text node with the prompt
  const textNode = document.createTextNode(prompt);

  // Insert the text node at the end of the editor
  editorElement.appendChild(textNode);

  // Dispatch an input event to notify ProseMirror of the change
  const event = new Event('input', { bubbles: true });
  editorElement.dispatchEvent(event);
}

function send_prompt() {
  const submitButton = document.getElementById('composer-submit-button');
  if (submitButton) {
    console.log('(not) Clicking');
    // submitButton.click();
  }
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'sendPrompt') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: update_prompt,
        args: [message.prompt],
      }).then(() => {
        console.log("update_prompt executed successfully.");
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: send_prompt,
          args: [],
        }).then(() => {
          console.log("send_prompt executed successfully.");
        }).catch((error) => {
          console.error("send_prompt execution failed:", error);
        });
      }).catch((error) => {
        console.error("update_prompt execution failed:", error);
      });
    });
  }
});
