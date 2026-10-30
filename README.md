
8
Skinstric AI — Interactive Analysis Experience
# Skinstric AI — Interactive Analysis Experience

🌐 **Live Demo:** [View Skinstric](https://skinstric-murex.vercel.app/)

💻 **Source Code:** [GitHub Repository](https://github.com/tracycrossrvt-gif/skinstric)
A responsive, multi-step React application guiding users from onboarding to selfie capture or upload and an API-driven analysis interface.

This repository showcases frontend work completed as part of my paid Skinstric development internship, with an emphasis on functional user flows, asynchronous API integration, and clear feedback through the experience.

Features
Guided onboarding with name and location validation
Multi-step navigation with context-aware back-button behavior
Profile-information submission to the Skinstric Phase One API
Selfie upload and browser camera capture using getUserMedia
Image submission to the Skinstric Phase Two API
Loading, permission, and error handling for asynchronous operations
Analysis dashboard with returned demographic estimates
Interactive category selection and confidence visualizations
Camera stream cleanup when leaving the capture experience
My Contributions
Built React user interfaces and screen transitions for onboarding and analysis
Implemented input validation, React state, and conditional rendering
Integrated API requests using fetch, JSON payloads, and error handling
Implemented browser camera access, selfie capture, and image-upload flows
Rendered returned analysis scores in selectable, interactive views
Developed responsive styling and visual interactions for the intended interface
Technology
Frontend: React, JavaScript, HTML, CSS
Build tooling: Vite, ESLint
Browser APIs: MediaDevices (getUserMedia), Canvas, FileReader
Integration: HTTP APIs using fetch
Run Locally
npm install
npm run dev
To check the build and linting:

npm run build
npm run lint
Camera access requires browser permission and generally HTTPS or localhost. The analysis flows depend on external Skinstric endpoints, whose availability is outside this repository's control.

Scope and Limitations
This repository contains a frontend implementation integrating with existing Skinstric API endpoints. It does not contain the underlying image-analysis model or backend implementation. The analysis results are outputs returned by the API, not independently validated clinical or demographic findings.

Some displayed analysis tiles and summary controls are currently presentational and do not open additional feature flows.

Author
Tracy Cross — Software Developer
Portfolio · GitHub · LinkedIn

