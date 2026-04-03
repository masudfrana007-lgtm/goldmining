import { Navigate } from "react-router-dom";
import { isMemberLoggedIn } from "../memberAuth";

export default function MemberProtectedRoute({ children }) {
  if (!isMemberLoggedIn()) return <Navigate to="/member/login" replace />;
  return children;
}
