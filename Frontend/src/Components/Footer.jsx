import React from "react";

const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-white/5 bg-background/50">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">U</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            URL<span className="text-primary">Short</span>
          </span>
        </div>

        <div className="flex gap-8 text-sm font-medium text-muted">
          <a href="#" className="hover:text-white transition-colors">
            Twitter
          </a>
          <a href="#" className="hover:text-white transition-colors">
            GitHub
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Contact
          </a>
        </div>

        <div className="text-sm text-muted">
          &copy; {new Date().getFullYear()} URLShort. Developed by{" "}
          <span className="text-white font-medium text-xs">Satish Raut</span>.
          All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
