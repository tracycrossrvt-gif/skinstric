import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const [isTyping, setIsTyping] = useState(false);
  const [name, setName] = useState("");
  const [step, setStep] = useState("name");
  const [location, setLocation] = useState("");
  const [apiError, setApiError] = useState("");
  const [image, setImage] = useState("");
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [activeCategory, setActiveCategory] = useState("race");
  const [selectedValues, setSelectedValues] = useState({
  race: "",
  age: "",
  gender: "",
});

  useEffect(() => {
  if (!cameraActive || !videoRef.current || !streamRef.current) {
    return;
  }

  const video = videoRef.current;

  video.srcObject = streamRef.current;

  video.play().catch((error) => {
    console.error("Video playback error:", error);
  });
}, [cameraActive]);

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

  if (cameraActive) {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
    return;
  }

  if (step === "demographics") {
    setStep("analysis");
    return;
  }

  if (step === "analysis") {
    setStep("image-source");
    return;
  }

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

async function handleCameraStart() {
  setCameraError("");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    streamRef.current = stream;
    setCameraActive(true);
  } catch (error) {
    console.error("Camera error:", error);
    setCameraError("Unable to access camera.");
  }
}

  function handleCaptureSelfie() {
  const video = videoRef.current;

  if (!video || !video.videoWidth || !video.videoHeight) {
    setCameraError("Camera is not ready yet. Please try again.");
    return;
  }

  const canvas = document.createElement("canvas");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    setCameraError("Unable to capture image.");
    return;
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const base64Image = canvas.toDataURL("image/jpeg", 0.92);

  setImage(base64Image);

  streamRef.current?.getTracks().forEach((track) => track.stop());
  streamRef.current = null;
  setCameraActive(false);

  handlePhaseTwo(base64Image);
}

  async function handlePhaseTwo(imageData) {
  setIsAnalyzing(true);

  try {
    const base64Image = imageData.split(",")[1];

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

const sortedScores = analysisData?.[activeCategory]
  ? Object.entries(analysisData[activeCategory]).sort(
      ([, scoreA], [, scoreB]) => scoreB - scoreA
    )
  : [];

const topPrediction = sortedScores[0];

function handleScoreSelect(label) {
  setSelectedValues((current) => ({
    ...current,
    [activeCategory]: label,
  }));
}

  return (
    <main className="page">
      <header className="header">
  <div className="brand">
    <span>SKINSTRIC</span>
    <span className="section-label">
  {step === "analysis" || step === "demographics"
    ? "[ ANALYSIS ]"
    : "[ INTRO ]"}
</span>
  </div>
</header>

{step !== "analysis" &&
  step !== "demographics" &&
  !cameraActive &&
  !isAnalyzing && (
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
  <div className="analysis-frame analysis-frame-one" />
  <div className="analysis-frame analysis-frame-two" />
  <div className="analysis-frame analysis-frame-three" />

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
  <span>
    SKIN TYPE
    <br />
    DETAILS
  </span>
</button>

      <button
  type="button"
  className="analysis-tile concerns-tile"
>
  <span>
    COSMETIC
    <br />
    CONCERNS
  </span>
</button>

      <button
  type="button"
  className="analysis-tile weather-tile"
>
  <span>WEATHER</span>
</button>
    </div>

    <button
  type="button"
  className="summary-button"
>
  <span className="summary-text">GET SUMMARY</span>

  <span className="summary-icon">
    <span className="summary-arrow">▶</span>
  </span>
</button>
  </div>

  ) : step === "demographics" ? (
  <div className="demographics-screen">
    <div className="demographics-heading">
      <strong>DEMOGRAPHICS</strong>
      <span>PREDICTED RACE &amp; AGE</span>
    </div>

    <div className="demographics-layout">
      <div className="category-tabs">
        <button
          type="button"
          className={activeCategory === "race" ? "active" : ""}
          onClick={() => setActiveCategory("race")}
        >
          RACE
        </button>

        <button
          type="button"
          className={activeCategory === "age" ? "active" : ""}
          onClick={() => setActiveCategory("age")}
        >
          AGE
        </button>

        <button
          type="button"
          className={activeCategory === "gender" ? "active" : ""}
          onClick={() => setActiveCategory("gender")}
        >
          SEX
        </button>
      </div>

      <div className="confidence-circle">
  <span>
    {(() => {
      const selectedLabel =
        selectedValues[activeCategory] || topPrediction?.[0];

      const selectedScore =
        analysisData?.[activeCategory]?.[selectedLabel];

      return selectedScore !== undefined
        ? `${(selectedScore * 100).toFixed(2)}%`
        : "—";
    })()}
  </span>
</div>

      <div className="score-list">
        {sortedScores.map(([label, score]) => (
          <button
            type="button"
            className={`score-row ${
              (selectedValues[activeCategory] || topPrediction?.[0]) === label
                ? "selected"
                : ""
            }`}
            key={label}
            onClick={() => handleScoreSelect(label)}
          >
            <span>{label}</span>
            <span>{(score * 100).toFixed(2)}%</span>
          </button>
        ))}
      </div>
    </div>
  </div>

    ) : cameraActive ? (
  <div className="camera-screen">
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="camera-preview"
    />

    <button
      type="button"
      className="capture-button"
      onClick={handleCaptureSelfie}
    >
      CAPTURE
    </button>

    {cameraError && (
      <p className="camera-error">{cameraError}</p>
    )}
  </div>
    ) : step === "image-source" ? (
        <div className="image-source-screen">
          <button
            type="button"
            className="source-option camera-option"
            onClick={handleCameraStart}
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
  <span className="back-icon">
    <span className="back-arrow">◀</span>
  </span>

  <span className="back-text">BACK</span>
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