import React, { createContext, useContext, useState } from "react";

type NavContextType = {
  activeSection: string;
  setActiveSection: (s: string) => void;
};

const NavContext = createContext<NavContextType>({
  activeSection: "home",
  setActiveSection: () => {},
});

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState("home");
  return (
    <NavContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </NavContext.Provider>
  );
}

export function useActiveSection() {
  return useContext(NavContext);
}
