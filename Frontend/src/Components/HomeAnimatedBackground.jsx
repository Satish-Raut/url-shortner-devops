import React from "react";

const HomeAnimatedBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-background">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[60%] h-[70%] bg-[radial-gradient(circle_at_70%_20%,rgba(99,102,241,0.15),transparent_70%)] animate-pulse-slow"></div>
      <div className="absolute bottom-0 left-0 w-[60%] h-[70%] bg-[radial-gradient(circle_at_30%_80%,rgba(236,72,153,0.1),transparent_70%)] animate-pulse-slow [animation-delay:2s]"></div>
      
      {/* Central glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.05),transparent_60%)]"></div>

      {/* Floating Geometric Elements */}
      <div className="absolute top-[15%] left-[5%] w-32 h-32 border border-primary/10 rounded-full animate-float blur-sm"></div>
      <div className="absolute top-[60%] left-[10%] w-16 h-16 bg-secondary/5 rounded-2xl animate-spin-slow rotate-45 blur-xs"></div>
      <div className="absolute top-[20%] right-[10%] w-48 h-48 border border-accent/10 rounded-3xl animate-float-delayed rotate-12 blur-sm"></div>
      <div className="absolute bottom-[20%] right-[15%] w-20 h-20 bg-primary/5 rounded-full animate-pulse-slow blur-xs"></div>

      {/* Drifting Particles/Shapes */}
      <div className="absolute top-[30%] -left-20 w-40 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-drift-slow rotate-[15deg]"></div>
      <div className="absolute bottom-[30%] -right-20 w-60 h-1 bg-gradient-to-r from-transparent via-secondary/20 to-transparent animate-drift-slower -rotate-[15deg]"></div>

      {/* Grid Pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]" 
        style={{ 
          backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
          backgroundSize: '100px 100px'
        }}
      ></div>

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(15,23,42,0.4)_100%)]"></div>
    </div>
  );
};

export default HomeAnimatedBackground;
