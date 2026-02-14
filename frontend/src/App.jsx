import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomeGoldMiracle from "./pages/HomeGoldMiracle.jsx";
import GoldMining from "./pages/GoldMining.jsx";
import TradingPro from "./pages/TradingPro.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import MiningPackages from "./pages/MiningPackages.jsx";
import StarterRig from "./pages/StarterRig.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<HomeGoldMiracle />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Trading */}
        <Route path="/trading" element={<TradingPro />} />

        {/* Mining (nested structure — cleaner URLs) */}
        <Route path="/mining">
          <Route index element={<GoldMining />} />
          <Route path="packages" element={<MiningPackages />} />
          <Route path="starter-rig" element={<StarterRig />} />
        </Route>

        {/* Redirect old URLs if needed */}
        <Route path="/mining-packages" element={<Navigate to="/mining/packages" replace />} />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
