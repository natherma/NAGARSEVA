import { Outlet, useNavigate, useLocation } from "react-router-dom";

const NAV = [
  { path: "/",        icon: "🏠", label: "Home"    },
  { path: "/raise",   icon: "➕", label: "Raise"   },
  { path: "/ward",    icon: "📍", label: "Ward"    },
  { path: "/profile", icon: "👤", label: "Profile" },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {/* Content */}
      <div style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 80 }}>
        <Outlet />
      </div>

      {/* Nav — fixed to viewport bottom, full width, then centered */}
      <nav style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        background: "#fff",
        borderTop: "1px solid #e0e0e0",
        display: "flex",
        zIndex: 9999,
        boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
      }}>
        {NAV.map((item) => {
          const active = item.path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.path);

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                padding: "10px 0 14px",
                border: "none",
                background: "none",
                fontSize: 10,
                fontWeight: active ? 700 : 400,
                color: active ? "#185FA5" : "#999",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 24, lineHeight: 1 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}