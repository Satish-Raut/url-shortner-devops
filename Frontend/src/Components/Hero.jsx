import React from "react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden min-h-screen flex items-center justify-center">
      <div className="max-w-5xl mx-auto text-center relative z-10">
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Next-Gen URL Management
          </div>
        </div>

        <div className="relative inline-block">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-12 leading-[1.1]">
            Shorten. Share. <br />
            <span className="text-gradient relative z-10">Analyze.</span>
          </h1>
          
          {/* Decorative Z-Line */}
          <div className="absolute top-1/4 -right-16 md:-right-32 w-48 md:w-64 opacity-80 text-primary pointer-events-none -z-10">
            <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]">
              <path 
                d="M 10 40 L 90 35 Q 105 35, 95 45 L 25 85 Q 15 90, 30 88 L 190 60" 
                stroke="url(#gradient)" 
                strokeWidth="6" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="animate-[draw_2s_ease-out_forwards]"
                style={{ strokeDasharray: 400, strokeDashoffset: 400 }}
              />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="200" y2="100" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate("/urlshortner")}
            className="relative z-10 px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-lg transition-all shadow-xl shadow-primary/30 active:scale-95 whitespace-nowrap cursor-pointer"
          >
            Short Your URL
          </button>

          <div className="mt-8 flex flex-wrap justify-center gap-8 text-sm font-medium text-muted">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              No Credit Card
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              Standard Free
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              Unlimited Links
            </div>
          </div>

          {/* Foreground Blinking Cards */}
          <div className="mt-16 flex flex-wrap justify-center gap-6">
            <div className="px-5 py-3 rounded-xl glass-card border-primary/20 bg-primary/5 flex items-center gap-3 animate-pulse shadow-lg shadow-primary/5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]"></div>
              <span className="font-mono text-sm text-primary tracking-wide">url.short/live-demo</span>
            </div>
            <div className="px-5 py-3 rounded-xl glass-card border-secondary/20 bg-secondary/5 flex items-center gap-3 animate-pulse shadow-lg shadow-secondary/5" style={{ animationDelay: '0.4s' }}>
              <div className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_var(--secondary)]"></div>
              <span className="font-mono text-sm text-secondary tracking-wide">url.short/aws-deploy</span>
            </div>
            <div className="px-5 py-3 rounded-xl glass-card border-accent/20 bg-accent/5 flex items-center gap-3 animate-pulse shadow-lg shadow-accent/5" style={{ animationDelay: '0.8s' }}>
              <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]"></div>
              <span className="font-mono text-sm text-accent tracking-wide">url.short/campaign</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
