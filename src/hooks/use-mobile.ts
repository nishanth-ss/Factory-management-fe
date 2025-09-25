import * as React from "react"

// A small hook to detect if the viewport is considered mobile.
// Matches Tailwind's md breakpoint (~768px).
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    // Guard for SSR or non-browser envs
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return
    }

    const mql = window.matchMedia("(max-width: 768px)")

    const onChange = () => setIsMobile(mql.matches)

    // Initialize on mount
    onChange()

    // Modern browsers
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    }

    mql.addListener(onChange)
    return () => mql.removeListener(onChange)
  }, [])

  return isMobile
}
