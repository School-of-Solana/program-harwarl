"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const root = window.document.documentElement;
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;

    if (savedTheme) {
      setTheme("dark");
      root.classList.toggle("dark", savedTheme === "dark");
    } else {
      setTheme("dark");
      root.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    const newTheme = theme === "light" ? "dark" : "light";

    setTheme("dark");
    localStorage.setItem("theme", newTheme);
    root.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <></>
    // <Button
    //   variant="ghost"
    //   size="sm"
    //   onClick={toggleTheme}
    //   className="w-9 h-9 p-0"
    // >
    //   {theme === "light" ? (
    //     <Moon className="w-4 h-4" />
    //   ) : (
    //     <Sun className="w-4 h-4" />
    //   )}
    //   <span className="sr-only">Toggle theme</span>
    // </Button>
  );
}
