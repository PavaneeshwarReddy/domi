import { useEffect, useState } from "react";
import { ImageDown, Cog, Pickaxe, CircleCheck } from "lucide-react";

function App() {
  const [domiId, setDomiId] = useState<string | null>(null);
  const [allCSSProperties,setAllCSSPropertyOptions] = useState<string[]>([]);
  const [defaultCSSProperties, setDefaultCSSProperties] = useState<Map<string,string>>();
  const [adjustedCSSProperties, setAdjustedCSSProperties] = useState<Map<string,string>>();


  /* 
    1. To show in the list, we need all styles
    2. We inject an element and get all default styles so that we can display in dropdown
  */
  const getAllCssProperties = () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const computedStyle = window.getComputedStyle(el);
    const allProps: string[] = [];
    for (let i = 0; i < computedStyle.length; i++) {
      allProps.push(computedStyle[i]);
    }
    document.body.removeChild(el);
    return allProps;
  }


  /*
    1. Active tabs will be queried, will get the element selected
    2. Default and adjusted styles are picked from there
    3. These styles needed to be deserialized again into map
  */
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTabId = tabs[0].id;
      
      chrome.storage.local.get(['selectedElement'], (result) => {
        if (result.selectedElement && result.selectedElement.tabId === currentTabId) {
          setDomiId(result.selectedElement.domiId);
          setDefaultCSSProperties(new Map(result.selectedElement.properties));
          setAdjustedCSSProperties(new Map(result.selectedElement.properties));
        } else {
          setDomiId(null);
        }
      });
    });

    setAllCSSPropertyOptions(getAllCssProperties());
  }, []);


  /*
    1. Whenever a property is adjusted we send message to background server
    2. This will be manipulating the DOM for styles
  */
  useEffect(()=>{
    if (domiId)
    chrome.runtime.sendMessage({
      type: "CSS_PROPERTY_CHANGED",
      domiId: domiId,
      properties:  Array.from(adjustedCSSProperties?.entries()!)
    });
  },[adjustedCSSProperties])


  /*
    1. Pick the current properties from adjusted properties
    2. If value is empty that means user had removed the change, then fall back to default style
    3. Set the newly adjusted property if value is present
  */
  const handleChangeInCSSProperties = (property: string, value: string) => {
    const newCSSProperties = new Map(adjustedCSSProperties);
    if(!value) {
      newCSSProperties.set(property, defaultCSSProperties?.get(property)!);
    } else {
      newCSSProperties.set(property, value);
    }
    setAdjustedCSSProperties(newCSSProperties);
  }


  const downloadImage = async() => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.scripting.executeScript<string[],void>({
        target: { tabId: tab.id },
        args: [domiId!],
        func: async (domiId) => {
          let elementSelected = document.querySelector(`[domiId="${domiId}"]`);
          console.log(elementSelected);
        }
      })
    }
  }

  
  /*
    1. Choose the active tab and pick the id from there
    2. When hovering on elements a border will be assigned to the outer htlm of that element , when clicked it will be selected
    3. Generate a random id and assign it as domiId property to that element
    4. Send a message stating that element is selected, the element will be saved locally

    NOTE: Map cannot be serialized it has to be converted into array before sending it to chrome engine
  */
  const onClick = async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          let lastHovered: HTMLElement | null = null;
          let lastClicked: HTMLElement | null = null;
          
          const generateRandomAlphabetId = (length = 10) => {
            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            let result = '';
            for (let i = 0; i < length; i++) {
              result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
          };
          
          const clearHoverStyle = () => {
            if (lastHovered) {
              lastHovered.style.outline = "";
              lastHovered = null;
            }
          };

          const clearClickStyle = () => {
            if (lastClicked) {
              lastClicked.style.boxShadow = "";
              lastClicked = null;
            }
          };

          const applyHoverStyle = (element: HTMLElement) => {
            clearHoverStyle();
            element.style.outline = "2px dashed #4285f4";
            lastHovered = element;
          };

          const applyClickStyle = (element: HTMLElement) => {
            clearClickStyle();
            element.style.boxShadow = "0 0 0 2px #4285f4 inset";
            lastClicked = element;
          };

          document.addEventListener("mousemove", (e) => {
            const target = e.target as HTMLElement;
            applyHoverStyle(target);
          });

          document.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const target = e.target as HTMLElement;
            const domiId = generateRandomAlphabetId();

            target.setAttribute('domiId', domiId);

            applyClickStyle(target);

            const computedStyles = window.getComputedStyle(target);
            let cssProperties: Map<string,string> = new Map<string,string>();
            
            for (let i = 0; i < computedStyles.length; i++) {
              const prop = computedStyles[i];
              cssProperties.set(prop,computedStyles.getPropertyValue(prop));
            }
            console.log(cssProperties)

            chrome.runtime.sendMessage({
              type: "ELEMENT_SELECTED",
              domiId: domiId,
              properties: Array.from(cssProperties.entries())
            });

          });
        },
      });
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyItems: "center",
        flexDirection: "column",
        gap: "10px",
        width: "300px",
        height: "auto",
        borderRadius: "20px",
        paddingLeft: "30px",
        paddingRight: "30px",
      }}
    >
      <img
        src="./logo.png"
        style={{
          width: "100px",
          height: "50px",
          objectFit: "contain",
        }}
      />

      {domiId ? (
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap : "10px"
          }}
        >
          <div
            style={{
              padding: "10px",
              borderRadius: "10px",
              backgroundColor: "#5687e4",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "10px",
              width: "100%",
            }}
          >
            <CircleCheck color="white" />{" "}
            <div
              style={{
                color: "white",
              }}
            >
              Element Selected
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems : "center",
              justifyContent : "space-between"
            }}
          >
            <div style={{
              display: "flex",
              flexDirection: "row",
              gap : "2px",
              cursor : "pointer",
              alignItems: "center"
            }}>
              <ImageDown onClick={downloadImage}/>
              <div>Download</div>
            </div>
            <div style={{
              display: "flex",
              flexDirection: "row",
              gap : "2px",
              cursor : "pointer",
              alignItems: "center"
            }}>
              <Cog />
              <div>Adjust CSS Props</div>
            </div>
          </div>
          <div style={{
            width : "100%",
            maxHeight: "300px",
            overflowY: "scroll",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            padding : "5px",
            backgroundColor: "#FCFCFC",
            borderRadius : "10px",
            scrollbarWidth: "none",
          }}> 
            {
              allCSSProperties.map((property,index)=><div key={index} style={{
                display: "flex",
                flexDirection : "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "5px"
              }}>
                <div style={{
                  width : "150px"
                }}>{property}</div>
                <input type="text" style={{
                  all: "unset",
                  width : "80px",
                  border: "0.5px solid lightgray",
                  borderRadius: "5px",
                  paddingLeft: "2px",
                  paddingBottom: "5px",
                  paddingTop: "5px",
                  paddingRight: "2px"
                }} 
                placeholder={adjustedCSSProperties?.get(property)}
                onChange={(e) => handleChangeInCSSProperties(property, e.target.value)}/>
              </div>)
            }
          </div>

        </div>
      ) : (
        <div
          style={{
            padding: "10px",
            cursor: "pointer",
            borderRadius: "10px",
            backgroundColor: "whitesmoke",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "10px",
            width: "100%",
          }}
          onClick={onClick}
        >
          <Pickaxe /> <div>Pick from Page</div>
        </div>
      )}
    </div>
  );
}

export default App;
