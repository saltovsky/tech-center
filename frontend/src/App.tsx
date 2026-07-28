import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DirectoryPage } from "./pages/DirectoryPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { useEffect } from "react";
import { useRouter } from "./router";

export default function App() {
  const { path, navigate } = useRouter();
  useEffect(() => {
    const known =
      path === "/login" ||
      path === "/documents" ||
      path === "/profile" ||
      path === "/settings" ||
      path.startsWith("/directories");
    if (!known) navigate("/documents", true);
  }, [navigate, path]);

  if (path === "/login") return <LoginPage />;
  const section = path.startsWith("/directories/")
    ? path.slice("/directories/".length)
    : "organizations";
  const page =
    path === "/settings" ? (
      <SettingsPage />
    ) : path === "/profile" ? (
      <ProfilePage />
    ) : path.startsWith("/directories") ? (
      <DirectoryPage section={section as "organizations" | "employees" | "device-types" | "conditions" | "statuses"} />
    ) : (
      <DocumentsPage />
    );
  return (
    <ProtectedRoute>
      <Layout>{page}</Layout>
    </ProtectedRoute>
  );
}
