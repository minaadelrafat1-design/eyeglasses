/**
 * Navigation shim.
 *
 * The storefront was authored against a generic router API (Link / NavLink /
 * Navigate / useNavigate / useParams / useLocation). This module adapts that
 * API onto TanStack Router so page and component code stays untouched and
 * framework-agnostic. Any future router change happens here only.
 */
import {
  Link as TanstackLink,
  Navigate as TanstackNavigate,
  useLocation as useTanstackLocation,
  useNavigate as useTanstackNavigate,
  useParams as useTanstackParams,
  useRouter,
} from "@tanstack/react-router";
import type { AnchorHTMLAttributes, ReactElement, ReactNode } from "react";

type LooseLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
  replace?: boolean;
  state?: unknown;
  children?: ReactNode;
};

const Loose = TanstackLink as unknown as (props: Record<string, unknown>) => ReactElement;

export function Link({ to, state: _state, ...rest }: LooseLinkProps) {
  return <Loose to={to} {...rest} />;
}

type NavLinkProps = Omit<LooseLinkProps, "className" | "children"> & {
  className?: string | ((state: { isActive: boolean }) => string);
  children?: ReactNode | ((state: { isActive: boolean }) => ReactNode);
  end?: boolean;
};

export function NavLink({ to, className, children, end, ...rest }: NavLinkProps) {
  const { pathname } = useTanstackLocation();
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  return (
    <Loose
      to={to}
      {...rest}
      className={typeof className === "function" ? className({ isActive }) : className}
    >
      {typeof children === "function" ? children({ isActive }) : children}
    </Loose>
  );
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const Comp = TanstackNavigate as unknown as (props: Record<string, unknown>) => ReactElement;
  return <Comp to={to} replace={replace} />;
}

export interface NavigateOptions {
  replace?: boolean;
  state?: unknown;
}

/** Accepts `navigate('/path')`, `navigate('/path', { replace: true })` and `navigate(-1)`. */
export function useNavigate() {
  const navigate = useTanstackNavigate();
  const router = useRouter();
  return (to: string | number, options?: NavigateOptions) => {
    if (typeof to === "number") {
      router.history.go(to);
      return;
    }
    void (navigate as unknown as (opts: Record<string, unknown>) => unknown)({
      to,
      replace: options?.replace ?? false,
    });
  };
}

export function useParams<T extends Record<string, string | undefined>>(): T {
  return useTanstackParams({ strict: false }) as unknown as T;
}

export function useLocation() {
  return useTanstackLocation();
}

export { Outlet } from "@tanstack/react-router";

/** TanStack Router handles scroll restoration at the router level. */
export function ScrollRestoration() {
  return null;
}
