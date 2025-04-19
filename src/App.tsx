import { useEffect, useState } from "react";
import { ImageDown, Cog, Pickaxe, CircleCheck } from "lucide-react";

function App() {
  const [domiId, setDomiId] = useState<string | null>(
    null
  );
  const [allCSSProperties,setAllCSSPropertyOptions] = useState<string[]>([]);

  const getAllCssProperties = () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const styleObj = el.style;
    const allProps = [];
    for (let prop in styleObj) {
      allProps.push(prop);
    }
    console.log(allProps)
    return allProps;
  }

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTabId = tabs[0].id;
      
      chrome.storage.local.get(['selectedElement'], (result) => {
        if (result.selectedElement && result.selectedElement.tabId === currentTabId) {
          setDomiId(result.selectedElement.domiId);
        } else {
          setDomiId(null);
        }
      });
    });

    setAllCSSPropertyOptions(getAllCssProperties());
  }, []);


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
            
            chrome.runtime.sendMessage({
              type: "ELEMENT_SELECTED",
              domiId: domiId
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

      {true ? (
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
              backgroundColor: "#8F7C6B",
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
            }}>
              <ImageDown onClick={downloadImage}/>
              <div>Download</div>
            </div>
            <div style={{
              display: "flex",
              flexDirection: "row",
              gap : "2px",
              cursor : "pointer"
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
            borderRadius : "10px"
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
                  padding: "1px"
                }}/>
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
