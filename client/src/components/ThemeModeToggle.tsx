import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";

export function ThemeModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => (theme === "dark" ? setTheme("light") : setTheme("dark"))}
      className="relative overflow-hidden"
    >
      <Sun
        className={`absolute transition-transform duration-1000 ease-in-out ${
          theme === "dark"
            ? "opacity-0 scale-50 rotate-[-45deg]"
            : "opacity-100 scale-100 rotate-0"
        }`}
        style={{ transitionProperty: "opacity, transform" }}
        fill="currentColor"
      />

      {/* Moon Icon for Dark Mode */}
      <Moon
        className={`absolute transition-transform duration-1000 ease-in-out ${
          theme === "dark"
            ? "opacity-100 scale-100 rotate-0"
            : "opacity-0 scale-50 rotate-[45deg]"
        }`}
        style={{ transitionProperty: "opacity, transform" }}
        fill="currentColor"
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
