import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getRoleIdFromAuth = (): 1 | 2 | 3 => {
  const persistRoot = localStorage.getItem("persist:root");
  if (!persistRoot) throw new Error("Persisted root not found");

  const root = JSON.parse(persistRoot);
  const authString = root.auth;
  if (!authString) throw new Error("Auth slice not found");

  const auth = JSON.parse(authString); 
  const role = auth.user.role.toLowerCase();

  return role === "superintendent" ? 1 : role === "storekeeper" ? 2 : 3;
};
