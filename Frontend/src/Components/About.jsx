import React from "react";

const About = () => {
  return (
    <section className="relative py-24 px-6 overflow-hidden z-10">
      <div className="max-w-4xl mx-auto text-center glass-card p-12 rounded-3xl border border-white/10 shadow-2xl">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
          About URL<span className="text-primary">Short</span>
        </h2>
        <div className="w-16 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full mb-8"></div>
        <p className="text-xl md:text-2xl text-muted leading-relaxed font-light italic">
          "Create short, powerful links that help you grow and track your audience. 
          Professional tools for everyone, from creators to enterprises."
        </p>
      </div>
    </section>
  );
};

export default About;
