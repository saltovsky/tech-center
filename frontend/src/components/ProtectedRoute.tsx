import { useAuth } from "../contexts/AuthContext";
import { Loading } from "./Loading";
import { useEffect, type PropsWithChildren } from "react";
import { useRouter } from "../router";

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const { navigate } = useRouter();
  useEffect(() => {
    if (!loading && !user) navigate("/login", true);
  }, [loading, navigate, user]);
  if (loading) return <Loading />;
  if (!user) return null;
  return children;
}
