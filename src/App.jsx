import { useState } from "react";
import "./App.css";

function App() {
  const [isTyping, setIsTyping] = useState(false);
  const [name, setName] = useState("");
  const [step, setStep] = useState("name");
  const [location, setLocation] = useState("");

  function handleNameKeyDown(event) {
    if (event.key === "Enter" && name.trim() !== "") {
      setStep("location");
      setIsTyping(false);
    }
  }

  function handleLocationKeyDown(event) {
    if (event.key === "Enter" && location.trim() !== "") {
      setIsTyping(false);
      setStep("complete");
    }
  }

  function handleProceed() {
    setStep("image-source");
  }

  return (
    <main className="page">
      <header className="header">
        <div className="brand">
          <span>SKINSTRIC</span>
          <span className="section-label">[ INTRO ]</span>
        </div>
      </header>

      <p className="eyebrow">TO START ANALYSIS</p>

      {step === "image-source" ? (
        <div className="image-source-placeholder">
          IMAGE SOURCE
        </div>
      ) : (
        <>
          <div className="diamond-wrap">
            <div className="diamond diamond-one" />
            <div className="diamond diamond-two" />
            <div className="diamond diamond-three" />
          </div>

          <div className="name-prompt">
            {step === "name" ? (
              !isTyping ? (
                <button
                  className="name-prompt-button"
                  onClick={() => setIsTyping(true)}
                >
                  <span>CLICK TO TYPE</span>
                  <strong>Introduce Yourself</strong>
                </button>
              ) : (
                <input
                  className="name-input"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onKeyDown={handleNameKeyDown}
                  placeholder="Introduce Yourself"
                  autoFocus
                />
              )
            ) : step === "location" ? (
              !isTyping ? (
                <button
                  className="name-prompt-button"
                  onClick={() => setIsTyping(true)}
                >
                  <span>CLICK TO TYPE</span>
                  <strong>Where are you from?</strong>
                </button>
              ) : (
                <input
                  className="name-input"
                  type="text"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  onKeyDown={handleLocationKeyDown}
                  placeholder="Where are you from?"
                  autoFocus
                />
              )
            ) : (
              <div className="location-complete">
                <span>WHERE ARE YOU FROM?</span>
                <strong>{location}</strong>
              </div>
            )}
          </div>

          {step === "complete" && (
            <button
              className="proceed-button"
              onClick={handleProceed}
            >
              PROCEED ◇
            </button>
          )}
        </>
      )}

      <button className="back-button">◇ BACK</button>
    </main>
  );
}

export default App;