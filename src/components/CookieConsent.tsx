import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";

const CONSENT_KEY = "jharva_cookie_consent";

type ConsentValue = "all" | "essential" | null;

function getStoredConsent(): ConsentValue {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(CONSENT_KEY);
  return v === "all" || v === "essential" ? v : null;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if no consent decision stored
    if (!getStoredConsent()) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = (choice: "all" | "essential") => {
    localStorage.setItem(CONSENT_KEY, choice);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
          className="fixed bottom-20 md:bottom-6 inset-x-3 md:inset-x-auto md:left-6 md:max-w-md z-50"
        >
          <div className="bg-card border border-gold/20 rounded-2xl shadow-luxe p-5 relative">
            <button
              onClick={() => accept("essential")}
              aria-label="Close"
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gold-gradient grid place-items-center shrink-0">
                <Cookie className="w-5 h-5 text-cocoa-deep" />
              </div>
              <div>
                <h3 className="font-display text-base text-primary font-semibold">
                  We value your privacy
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  We use cookies and local storage to keep your cart, wishlist, and preferences.
                  No tracking or advertising cookies.{" "}
                  <a href="#" className="text-primary underline hover:text-gold">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => accept("all")}
                className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-full text-xs uppercase tracking-widest font-semibold hover:bg-cocoa-deep transition"
              >
                Accept All
              </button>
              <button
                onClick={() => accept("essential")}
                className="flex-1 border border-border text-foreground py-2.5 rounded-full text-xs uppercase tracking-widest font-semibold hover:bg-muted transition"
              >
                Essential Only
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
