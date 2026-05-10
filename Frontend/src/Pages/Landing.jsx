import React from "react";
import Hero from "../Components/Hero";
import About from "../Components/About";
import Features from "../Components/Features";
import HomeAnimatedBackground from "../Components/HomeAnimatedBackground";

const Landing = () => {
  return (
    <>
      <HomeAnimatedBackground />
      <Hero />
      <About />
      <Features />
    </>
  );
};

export default Landing;
