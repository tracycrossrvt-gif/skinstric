import { useRef, useState } from "react";
import "./App.css";

function App() {
  const [isTyping, setIsTyping] = useState(false);
  const [name, setName] = useState("");
  const [step, setStep] = useState("name");
  const [location, setLocation] = useState("");
  const [apiError, setApiError] = useState("");
  const [image, setImage] = useState("");
  const fileInputRef = useRef(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  function handleImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    console.log("Selected file:", file.name);

    const reader = new FileReader();

    reader.onloadend = () => {
  const base64Image = reader.result;
  setImage(base64Image);
  handlePhaseTwo(base64Image);
};

    reader.readAsDataURL(file);
  }

  async function handlePhaseTwo(imageData) {
  setIsAnalyzing(true);

  try {
    const base64Image = image.split(",")[1];

    const response = await fetch(
      "https://us-central1-api-skinstric-ai.cloudfunctions.net/skinstricPhaseTwo",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Image,
        }),
      }
    );

    const data = await response.json();

    console.log("Phase 2 response:", data);

    if (!response.ok) {
      throw new Error("Failed to analyze image");
    }

    setAnalysisData(data.data);
    setStep("analysis");
  } catch (error) {
    console.error("Phase 2 API error:", error);
  } finally {
    setIsAnalyzing(false);
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

{step !== "analysis" && !isAnalyzing && (
  <p className="eyebrow">TO START ANALYSIS</p>
)}

{isAnalyzing ? (
  <div className="analysis-loading">
    <div className="loading-diamond diamond-one" />
    <div className="loading-diamond diamond-two" />
    <div className="loading-diamond diamond-three" />

    <p>PREPARING YOUR ANALYSIS...</p>
  </div>
) : step === "analysis" ? (

  <div className="analysis-screen">
    <div className="analysis-heading">
      <strong>A.I. ANALYSIS</strong>
      <span>A.I. HAS ESTIMATED THE FOLLOWING.</span>
      <span>FIX ESTIMATED INFORMATION IF NEEDED.</span>
    </div>

    <div className="analysis-grid">
      <button
  type="button"
  className="analysis-tile demographics-tile"
  onClick={() => setStep("demographics")}
>
  DEMOGRAPHICS
</button>

      <button
        type="button"
        className="analysis-tile skin-tile"
      >
        SKIN TYPE
        <br />
        DETAILS
      </button>

      <button
        type="button"
        className="analysis-tile concerns-tile"
      >
        COSMETIC
        <br />
        CONCERNS
      </button>

      <button
        type="button"
        className="analysis-tile weather-tile"
      >
        WEATHER
      </button>
    </div>

    <button
      type="button"
      className="summary-button"
    >
      GET SUMMARY ◇
    </button>
  </div>
) : step === "image-source" ? (
        <div className="image-source-screen">
          <button
            type="button"
            className="source-option camera-option"
          >
            <div className="source-diamond">
              <div className="diamond diamond-one" />
              <div className="diamond diamond-two" />
              <div className="diamond diamond-three" />

              <img
                className="source-icon-image"
                src="/camera.svg"
                alt="Camera"
              />
            </div>

            <span className="source-label">
              ALLOW A.I. TO
              <br />
              SCAN YOUR FACE
            </span>
          </button>

          <button
            type="button"
            className="source-option gallery-option"
            onClick={() => {
  if (fileInputRef.current) {
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  }
}}
          >
            <div className="source-diamond">
              <div className="diamond diamond-one" />
              <div className="diamond diamond-two" />
              <div className="diamond diamond-three" />

              <img
                className="source-icon-image"
                src="/gallery.svg"
                alt="Gallery"
              />
            </div>

            <span className="source-label">
              ALLOW A.I.
              <br />
              ACCESS GALLERY
            </span>
          </button>
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageUpload}
      />
    </main>
  );
}

export default App;