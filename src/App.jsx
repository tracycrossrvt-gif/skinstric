import { useState } from "react";
import "./App.css";

function App() {
  const [isTyping, setIsTyping] = useState(false);
  const [name, setName] = useState("");
  const [step, setStep] = useState("name");
  const [location, setLocation] = useState("");
  const [apiError, setApiError] = useState("");

function isValidName(value) {
  return /^[A-Za-z\s'-]+$/.test(value.trim());
}

function isValidLocation(value) {
  return /^[A-Za-z\s.'-]+$/.test(value.trim());
}

  function handleNameKeyDown(event) {
  if (event.key === "Enter" && isValidName(name)) {
    setStep("location");
    setIsTyping(false);
  }
}

function handleLocationKeyDown(event) {
  if (event.key === "Enter" && isValidLocation(location)) {
    setIsTyping(false);
    setStep("complete");
  }
}

  async function handleProceed() {
  setApiError("");

  try {
    const response = await fetch(
      "https://us-central1-api-skinstric-ai.cloudfunctions.net/skinstricPhaseOne",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          location: location.trim(),
        }),
      }
    );

    const data = await response.json();

    console.log(data);

    if (!response.ok) {
      throw new Error("Failed to submit user information");
    }

    setStep("image-source");
  } catch (error) {
    console.error("Phase 1 API error:", error);
    setApiError("Something went wrong. Please try again.");
  }
}

  function handleBack(event) {
  event.preventDefault();

  if (step === "image-source") {
    setStep("complete");
    return;
  }

  if (step === "complete") {
    setStep("location");
    setIsTyping(false);
    return;
  }

  if (step === "location") {
    setStep("name");
    setIsTyping(false);
  }
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

      <button
  type="button"
  className="back-button"
  onClick={handleBack}
>
  ◇ BACK
</button>

      {apiError && (
  <p className="api-error">
    {apiError}
  </p>
)}
    </main>
  );
}

export default App;