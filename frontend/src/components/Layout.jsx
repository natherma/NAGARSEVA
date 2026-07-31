import { Outlet, useNavigate, useLocation } from "react-router-dom";

const NAV = [
  { path: "/",      icon: "🏠", label: "Home"  },
  { path: "/raise", icon: "➕", label: "Raise" },
  { path: "/ward",  icon: "📍", label: "Ward"  },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh",
                  display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, paddingBottom: 68 }}>
        <Outlet />
      </div>
      <nav style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 480, background: "#fff",
        borderTop: "0.5px solid #e0e0e0", display: "flex", zIndex: 100,
      }}>
        {NAV.map((item) => {
          const active = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
          return (
            <button key={item.path} onClick={() => navigate(item.path)} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              gap: 2, padding: "10px 0 14px", border: "none", background: "none",
              fontSize: 10, color: active ? "#185FA5" : "#999", fontWeight: active ? 600 : 400,
            }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}