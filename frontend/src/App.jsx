import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import RaiseTicket from "./pages/RaiseTicket";
import TicketDetail from "./pages/TicketDetail";
import WardFeed from "./pages/WardFeed";
import TrackTicket from "./pages/TrackTicket";
import ProfilePage from "./pages/ProfilePage";


function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 32, textAlign: "center" }}>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/track"    element={<TrackTicket />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index              element={<HomePage />} />
        <Route path="raise"       element={<RaiseTicket />} />
        <Route path="ticket/:id"  element={<TicketDetail />} />
        <Route path="ward"        element={<WardFeed />} />
      </Route>
    </Routes>
  );
}