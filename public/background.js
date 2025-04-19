/*
  1. Selects element based on domiId
  2. Applies styles to that selected element
*/
function applyStylesToElement(domiId, properties) {
  const element = document.querySelector(`[domiId="${domiId}"]`);
  console.log('APPLY_STYLES')
  for (const [property, value] of Object.entries(properties)) {
    element.style[property] = value;
  }
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    /*
      TYPE: ELEMENT_SELECTED
      CONDITION: whenever an element is selected this gets executed, this stores values into local storage
    */
    if (message.type === "ELEMENT_SELECTED") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;
        chrome.storage.local.set({ 
          selectedElement: {
            tabId: tabId,
            domiId: message.domiId,
            properties: message.properties
          }
        });
      });
    }

    /*
      TYPE: CSS_PROPERTY_CHANGED
      CONDITION: whenever a new property is changed is adjusted in extension context
    */
    if (message.type === "CSS_PROPERTY_CHANGED") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tabId = tabs[0].id;
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            args: [message.domiId, message.properties],
            function: (domiId, properties) => {
              const element = document.querySelector(`[domiId="${domiId}"]`);
              const toCamelCase = (kebab) => kebab.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
              for (const [index, propertyData] of Object.entries(properties)) {
                const propertyKey = toCamelCase(propertyData[0]), propertyValue = propertyData[1];
                element.style[propertyKey] = propertyValue;
                console.log(propertyKey,propertyValue)
              }
            }
          });
        })
    }

  });