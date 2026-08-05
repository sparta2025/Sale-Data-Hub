import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Wire up the bearer token so every API request includes Authorization: Bearer <token>
setAuthTokenGetter(() => localStorage.getItem("sbi_token"));

createRoot(document.getElementById("root")!).render(<App />);
