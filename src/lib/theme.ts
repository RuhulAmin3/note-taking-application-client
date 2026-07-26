type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * The theme lives on <html>, put there by an inline script before first paint.
 * That makes the DOM the source of truth, so components read it as an external
 * store rather than mirroring it into React state.
 */
export function subscribeTheme(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getTheme(): "dark" | "light" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** The server has no DOM to read, and the script has not run yet. */
export function getServerTheme(): "dark" | "light" {
  return "light";
}

export function setTheme(next: "dark" | "light") {
  document.documentElement.classList.toggle("dark", next === "dark");
  try {
    localStorage.setItem("theme", next);
  } catch {
    // Private browsing can refuse writes; the class is already applied.
  }
  listeners.forEach((listener) => listener());
}
