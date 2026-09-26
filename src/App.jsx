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
  const [cameraStage, setCameraStage] = useState("idle");
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
  useEffect(() => {
    if (step === "camera") {
      return;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraActive(false);
    }
  }, [step]);
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);
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
    if (step === "camera") {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraActive(false);
      setCameraStage("idle");
      setStep("image-source");
      return;
    }
    if (cameraActive) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraActive(false);
      setCameraStage("idle");
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
      if (cameraStage === "permission") {
        setCameraStage("idle");
        return;
      }
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
  function handleCameraStart() {
    setCameraError("");
    setCameraStage("permission");
  }
  async function handleCameraAllow() {
    setCameraError("");
    setCameraStage("setup");
    setStep("camera");
    const setupStartedAt = Date.now();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      streamRef.current = stream;
      const elapsed = Date.now() - setupStartedAt;
      const remaining = Math.max(0, 1500 - elapsed);
      await new Promise((resolve) => setTimeout(resolve, remaining));
      setCameraStage("live");
      setCameraActive(true);
    } catch (error) {
      console.error("Camera error:", error);
      setCameraError("Unable to access camera.");
      setCameraStage("idle");
      setStep("image-source");
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
    setCameraStage("idle");
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
  const getTopSelections = () => {
    const categories = ["race", "age", "gender"];
    return Object.fromEntries(
      categories.map((category) => {
        const entries = Object.entries(analysisData?.[category] || {}).sort(
          (a, b) => b[1] - a[1]
        );
        return [category, entries[0]?.[0] || ""];
      })
    );
  };
  const handleDemographicsReset = () => {
    setSelectedValues(getTopSelections());
  };
  const handleDemographicsConfirm = () => {
    setStep("analysis");
  };
  return (
    <main className="page">
      {!(step === "camera" && cameraStage === "setup") && (
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
      )}
      {step !== "analysis" &&
        step !== "demographics" &&
        step !== "camera" &&
        !cameraActive &&
        !isAnalyzing && <p className="eyebrow">TO START ANALYSIS</p>}
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
            <button type="button" className="analysis-tile skin-tile">
              <span>
                SKIN TYPE
                <br />
                DETAILS
              </span>
            </button>
            <button type="button" className="analysis-tile concerns-tile">
              <span>
                COSMETIC
                <br />
                CONCERNS
              </span>
            </button>
            <button type="button" className="analysis-tile weather-tile">
              <span>WEATHER</span>
            </button>
          </div>
          <button type="button" className="summary-button">
            <span className="summary-text">GET SUMMARY</span>
            <span className="summary-icon">
              <span className="summary-arrow">▶</span>
            </span>
          </button>
        </div>
      ) : step === "demographics" ? (
        <div className="demographics-screen">
          <div className="demographics-heading">
            <span className="analysis-eyebrow">A.I. ANALYSIS</span>
            <div className="demographics-title-row">
  <strong>DEMOGRAPHICS</strong>

        <div className="demographics-nav" aria-hidden="true">
  <span className="demographics-nav-icon">
    <span className="demographics-nav-arrow">◀</span>
  </span>

  <span className="demographics-nav-icon">
    <span className="demographics-nav-arrow">▶</span>
  </span>
</div>
</div>
            <span>PREDICTED RACE &amp; AGE</span>
          </div>
          <div className="demographics-layout">
            <div className="category-tabs">
              {["race", "age", "gender"].map((category) => (
                <button
                  key={category}
                  type="button"
                  className={activeCategory === category ? "active" : ""}
                  onClick={() => setActiveCategory(category)}
                >
                  <strong>
                    {selectedValues[category] ||
                      Object.entries(analysisData?.[category] || {}).sort(
                        (a, b) => b[1] - a[1]
                      )[0]?.[0] ||
                      "—"}
                  </strong>
                  <span>
                    {category === "gender" ? "SEX" : category.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
            <div className="prediction-focus">
              <strong>
                {selectedValues[activeCategory] || topPrediction?.[0] || "—"}
              </strong>
              <div className="confidence-circle">
                {(() => {
                  const selectedLabel =
                    selectedValues[activeCategory] || topPrediction?.[0];
                  const selectedScore =
                    analysisData?.[activeCategory]?.[selectedLabel] ?? 0;
                  const percent = selectedScore * 100;
                  const radius = 47;
                  const circumference = 2 * Math.PI * radius;
                  const offset =
                    circumference - (percent / 100) * circumference;
                  return (
                    <>
                      <svg
                        className="confidence-ring"
                        viewBox="0 0 100 100"
                        aria-hidden="true"
                      >
                        <circle
                          className="confidence-ring-track"
                          cx="50"
                          cy="50"
                          r={radius}
                        />
                        <circle
                          className="confidence-ring-value"
                          cx="50"
                          cy="50"
                          r={radius}
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                        />
                      </svg>
                      <span>{percent.toFixed(2)}%</span>
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="score-list">
              <div className="score-list-header">
                <span>
                  {activeCategory === "gender"
                    ? "SEX"
                    : activeCategory.toUpperCase()}
                </span>
                <span>A.I. CONFIDENCE</span>
              </div>
              {sortedScores.map(([label, score]) => (
                <button
                  key={label}
                  type="button"
                  className={`score-row ${
                    (selectedValues[activeCategory] || topPrediction?.[0]) ===
                    label
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => handleScoreSelect(label)}
                >
                  <span className="score-label">
                    <span className="score-diamond">◇</span>
                    {label}
                  </span>
                  <span>{(score * 100).toFixed(2)}%</span>
                </button>
              ))}
            </div>
          </div>
          <div className="demographics-instruction">
            If A.I. estimate is wrong, select the correct one.
          </div>
          <div className="demographics-actions">
            <button
              type="button"
              className="reset-button"
              onClick={handleDemographicsReset}
            >
              RESET
            </button>
            <button
              type="button"
              className="confirm-button"
              onClick={handleDemographicsConfirm}
            >
              CONFIRM
            </button>
          </div>
        </div>
      ) : step === "camera" && cameraStage === "setup" ? (
        <div className="camera-setup-screen">
          <div className="camera-setup-group">
            <div className="camera-setup-frames">
              <div className="setup-frame setup-frame-one" />
              <div className="setup-frame setup-frame-two" />
              <div className="setup-frame setup-frame-three" />
            </div>
            <img src="/camera.svg" alt="" className="camera-setup-icon" />
            <strong className="camera-setup-status">
              SETTING UP CAMERA ...
            </strong>
          </div>
          <div className="camera-tips">
            <span>TO GET BETTER RESULTS MAKE SURE TO HAVE</span>
            <div>
              <span>◇ NEUTRAL EXPRESSION</span>
              <span>◇ FRONTAL POSE</span>
              <span>◇ ADEQUATE LIGHTING</span>
            </div>
          </div>
        </div>
      ) : step === "camera" && cameraStage === "live" && cameraActive ? (
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
          {cameraError && <p className="camera-error">{cameraError}</p>}
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
          {cameraStage === "permission" && (
            <div className="camera-permission-overlay">
              <strong>ALLOW A.I. TO ACCESS YOUR CAMERA</strong>
              <div className="camera-permission-actions">
                <button
                  type="button"
                  onClick={() => setCameraStage("idle")}
                >
                  DENY
                </button>
                <button type="button" onClick={handleCameraAllow}>
                  ALLOW
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            className={`source-option gallery-option ${
              cameraStage === "permission" ? "source-option-dimmed" : ""
            }`}
            aria-disabled={cameraStage === "permission"}
            onClick={() => {
              if (cameraStage === "permission") {
                return;
              }
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
            <button className="proceed-button" onClick={handleProceed}>
              PROCEED ◇
            </button>
          )}
        </>
      )}
      {!(step === "camera" && cameraStage === "setup") && (
        <button type="button" className="back-button" onClick={handleBack}>
          <span className="back-icon">
            <span className="back-arrow">◀</span>
          </span>
          <span className="back-text">BACK</span>
        </button>
      )}
      {apiError && <p className="api-error">{apiError}</p>}
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
