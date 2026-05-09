import React from "react";
import { Outlet } from "react-router";
import Navbar from "../Components/Navbar";
import Hero from "../Components/Hero";
import Features from "../Components/Features";
import Footer from "../Components/Footer";

const Home = () => {
  return (
    <main className="relative min-h-screen bg-transparent text-foreground selection:bg-primary/30 overflow-x-hidden">

      <Navbar />
      <div className="relative z-10">
        <Outlet />
      </div>
      <Footer />
    </main>
  );
};

export default Home;
