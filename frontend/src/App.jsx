import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import HomeGoldMiracle from "./pages/HomeGoldMiracle.jsx";
import GoldMining from "./pages/GoldMining.jsx";
import TradingPro from "./pages/TradingPro.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import MiningPackages from "./pages/MiningPackages.jsx";
import StarterRig from "./pages/StarterRig.jsx";
import SilverMiner from "./pages/SilverMiner.jsx";
import GoldCore from "./pages/GoldCore.jsx";
import PlatinumArray from "./pages/PlatinumArray.jsx"; // ✅ ADD
import TradingDashboardGoldMiracle from "./pages/TradingDashboardGoldMiracle.jsx";
import DashboardGoldMiracle from "./pages/DashboardGoldMiracle.jsx";

import CustomerService from "./pages/CustomerService.jsx";
import MemberDeposit from "./pages/MemberDeposit.jsx";
import MemberDepositCrypto from "./pages/MemberDepositCrypto.jsx";
import MemberDepositBank from "./pages/MemberDepositBank.jsx";
import TitanVaultRig from "./pages/TitanVaultRig.jsx";
import HowItWorks from "./pages/HowItWorks";
import BronzeMiner from "./pages/BronzeMiner.jsx";
import Disclaimer from "./pages/Disclaimer.jsx";
import Privacy from "./pages/Privacy.jsx";
import Terms from "./pages/Terms.jsx";
import Records from "./pages/Records.jsx";
import WithdrawalMethod from "./pages/WithdrawalMethod.jsx";
import AiDashboard from "./pages/GoldMiracleAIDashboard.jsx";

// Admin Pages
import AdminLogin from "./pages/admin/Login.jsx";
import AdminCsLogin from "./pages/admin/CsLogin.jsx";
import AdminDashboard from "./pages/admin/DashboardMain.jsx";
import AdminUsers from "./pages/admin/Users/Users.jsx";
import AdminMembers from "./pages/admin/Member/Members.jsx";
import AdminCreateMember from "./pages/admin/Member/CreateMember.jsx";
import MemberWallet from "./pages/admin/Member/MemberWallet.jsx";
import MemberEdit from "./pages/admin/Member/MemberEdit.jsx";
import CreateMemberDeposit from "./pages/admin/Member/CreateMemberDeposit.jsx";
import CreateMemberWithdrawal from "./pages/admin/Member/CreateMemberWithdrawal.jsx";
import VipWalletAddresses from "./pages/admin/VipWalletAddresses";
import Settings from "./pages/admin/Settings.jsx";
import ForgotPassword from "./pages/admin/ForgotPassword";


// need to create MemberEdit.jsx for the edit page


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeGoldMiracle />} />

        <Route path="/mining" element={<GoldMining />} />
        <Route path="/trading" element={<TradingPro />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/mining-packages" element={<MiningPackages />} />
        <Route path="/mining/starter-rig" element={<StarterRig />} />
        <Route path="/mining/silver-miner" element={<SilverMiner />} />
        <Route path="/mining/gold-core" element={<GoldCore />} />
        <Route path="/mining/platinum-array" element={<PlatinumArray />} /> {/* ✅ ADD */}

        <Route path="/dashboard" element={<DashboardGoldMiracle />} />
        <Route path="/member/dashboard" element={<DashboardGoldMiracle />} />
        <Route path="/member/trading-dashboard" element={<TradingDashboardGoldMiracle />} />

        <Route path="/customer-service" element={<CustomerService />} />
        <Route path="/member/deposit" element={<MemberDeposit />} />
        <Route path="/member/deposit/crypto" element={<MemberDepositCrypto />} />
        <Route path="/member/deposit/bank" element={<MemberDepositBank />} />
        <Route path="/mining/titan-vault-rig" element={<TitanVaultRig />} />
        <Route path="/member/how-it-works" element={<HowItWorks />} />

        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        <Route path="/member/mining/bronze-miner" element={<BronzeMiner />} />
        <Route path="/records" element={<Records />} />
        <Route path="/member/withdrawal-method" element={<WithdrawalMethod />} />
        <Route path="/member/ai-dashboard" element={<AiDashboard />} />

        {/* ===== ADMIN ROUTES ===== */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/cs-login" element={<AdminCsLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/vip-wallets" element={<VipWalletAddresses />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/forgot-password" element={<ForgotPassword />} />
        
        
        {/* Members routes */}
        <Route path="/admin/member/members" element={<AdminMembers />} />
        <Route path="/admin/member/create" element={<AdminCreateMember />} />
        
        <Route 
          path="/members/:memberId/wallet" 
          element={
            <ProtectedRoute roles={["owner", "agent"]}>
              <MemberWallet />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/members/:memberId/edit" 
          element={
            <ProtectedRoute roles={["owner", "agent"]}>
              <MemberEdit />
            </ProtectedRoute>
          } 
        />

        <Route
          path= "/members/:memberId/wallet/deposit/new"
          element={
            <ProtectedRoute roles={["owner","agent"]}>
              <CreateMemberDeposit />
            </ProtectedRoute>
          }
        />

        <Route
          path= "/members/:memberId/wallet/withdraw/new"
          element={
            <ProtectedRoute roles={["owner","agent"]}>
              <CreateMemberWithdrawal />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}