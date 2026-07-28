import {
  createContext,
  type MouseEvent,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface RouterValue {
  path: string;
  navigate: (to: string, replace?: boolean) => void;
}

const RouterContext = createContext<RouterValue | null>(null);

export function RouterProvider({ children }: PropsWithChildren) {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  const value = useMemo<RouterValue>(
    () => ({
      path,
      navigate: (to, replace = false) => {
        if (to === window.location.pathname) return;
        window.history[replace ? "replaceState" : "pushState"]({}, "", to);
        setPath(to);
        window.scrollTo({ top: 0 });
      },
    }),
    [path],
  );
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterValue {
  const context = useContext(RouterContext);
  if (!context) throw new Error("useRouter must be used within RouterProvider");
  return context;
}

interface AppLinkProps extends PropsWithChildren {
  to: string;
  className?: string | ((active: boolean) => string);
}

export function AppLink({ to, className, children }: AppLinkProps) {
  const { path, navigate } = useRouter();
  const active = path === to || (to !== "/" && path.startsWith(`${to}/`));
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return;
    event.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} className={typeof className === "function" ? className(active) : className} onClick={handleClick}>
      {children}
    </a>
  );
}

