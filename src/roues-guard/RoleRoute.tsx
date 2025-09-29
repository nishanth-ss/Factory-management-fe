import React from "react";
import { Route } from "wouter";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

type RoleRouteProps = {
  component: React.ComponentType<any>;
  path: string;
  allowedRoles: number[]; // e.g. [1] for admin
  fallbackPath?: string;  // where to send unauthorized users (default: /not-authorized)
};

export default function RoleRoute({
  component: Component,
  path,
  allowedRoles,
  fallbackPath = "/not-authorized",
}: RoleRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <Route
      path={path}
      component={(props: any) => {
        // while auth is resolving, render nothing (App shows loading state elsewhere)
        if (isLoading) return null;

        // not authenticated -> send to root (or /login if you have a route)
        if (!isAuthenticated) {
          setLocation("/"); // or "/login"
          return null;
        }

        // derive roleId from user object (adjust if your shape differs)
        const roleString = (user?.role || "").toString().toLowerCase();
        const roleId = roleString === "admin" ? 1 : 2;

        if (!allowedRoles.includes(roleId)) {
          setLocation(fallbackPath);
          return null;
        }

        return <Component {...props} />;
      }}
    />
  );
}
