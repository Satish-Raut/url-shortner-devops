import React from "react";

const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Dynamic Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] animate-pulse-slow"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-1/4 left-10 w-24 h-24 bg-primary/10 rounded-3xl blur-sm animate-float"></div>
      <div className="absolute bottom-1/4 right-20 w-32 h-32 bg-secondary/10 rounded-full blur-md animate-float-delayed"></div>
      
      {/* Data Streams */}
      <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-primary/30 to-transparent animate-data-stream"></div>
      <div className="absolute top-0 right-1/3 w-[1px] h-full bg-gradient-to-b from-transparent via-secondary/20 to-transparent animate-data-stream [animation-delay:4s]"></div>
      <div className="absolute top-0 left-2/3 w-[1px] h-full bg-gradient-to-b from-transparent via-accent/20 to-transparent animate-data-stream [animation-delay:8s]"></div>

      {/* Grid Pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: `radial-gradient(var(--primary) 1px, transparent 1px)`,
          backgroundSize: '40px 40px' 
        }}
      ></div>
    </div>
  );
};

export default AnimatedBackground;
