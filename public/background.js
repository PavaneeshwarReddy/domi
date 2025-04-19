chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    console.log(message.domiId)

    if (message.type === "ELEMENT_SELECTED") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;
        chrome.storage.local.set({ 
          selectedElement: {
            tabId: tabId,
            domiId: message.domiId
          }
        });
      });
    }

  });