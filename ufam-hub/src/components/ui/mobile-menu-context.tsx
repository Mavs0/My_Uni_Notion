"use client";
import * as React from "react";
interface MobileMenuContextType {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}
const MobileMenuContext = React.createContext<
  MobileMenuContextType | undefined
>(undefined);
export function MobileMenuProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  return (
    <MobileMenuContext.Provider value={{ mobileMenuOpen, setMobileMenuOpen }}>
      {children}
    </MobileMenuContext.Provider>
  );
}
export function useMobileMenu() {
  const context = React.useContext(MobileMenuContext);
  if (context === undefined) {
    throw new Error("useMobileMenu must be used within MobileMenuProvider");
  }
  return context;
}