"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [studentCount, setStudentCount] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const deferredPrompt = useRef(null);

  useEffect(() => {
    const fetchStats = async () => {
       try {
         const res = await fetch("/api/public/stats");
         const data = await res.json();
         setStudentCount(data.total || 2);
         setSuccessRate(data.successRate || 95);
         setTotalSubjects(data.totalSubjects || 5);
       } catch (e) { setStudentCount(2); setSuccessRate(95); setTotalSubjects(5); }
    };
    fetchStats();

    // Listen for PWA install prompt
    const handler = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleDownload = async () => {
    if (deferredPrompt.current) {
      deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === 'accepted') {
        alert('🎉 Cat Academy is being installed! Check your home screen!');
      }
      deferredPrompt.current = null;
    } else {
      // Fallback for iOS or browsers that don't support beforeinstallprompt
      alert('📱 To install Cat Academy:\n\n• iPhone/iPad: Tap the Share button (⬆️), then "Add to Home Screen"\n• Android Chrome: Tap the menu (⋮), then "Install App"\n• Desktop: Click the install icon (⊕) in your address bar');
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 relative font-sans">
        {/* Animated Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-light/60 mix-blend-multiply filter blur-[80px] blob-shape opacity-70"></div>
        <div className="absolute top-[40%] right-[-5%] w-[600px] h-[600px] bg-secondary/10 mix-blend-multiply filter blur-[100px] blob-shape animation-delay-2000 opacity-60"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-accent/15 mix-blend-multiply filter blur-[60px] blob-shape animation-delay-4000 opacity-50"></div>

      {/* Navigation */}
      <nav className="fixed w-full top-0 px-6 md:px-12 py-4 flex justify-between items-center z-50 bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 shadow-sm transition-all">
        <div className="text-xl md:text-2xl font-black flex items-center gap-3 text-slate-800">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-slate-100">
             <img src="/cat-hat-logo.png" alt="Cat Academy" className="w-full h-full object-cover" />
          </div>
          Cat Academy
        </div>
        <div className="flex gap-2 md:gap-4 items-center">
          <button className="hidden md:block px-6 py-2.5 rounded-full font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors" onClick={() => router.push("/login")}>Login</button>
          <button className="btn-primary !px-6 !py-2.5 !text-sm md:!text-base flex items-center gap-2" onClick={() => router.push("/login")}>
            Join Now <span className="text-lg">🎓</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 container mx-auto px-6 pt-32 md:pt-48 pb-24 flex flex-col items-center min-h-[85vh] text-center max-w-5xl">
        <div className="animate-fade-in flex flex-col items-center w-full">
          <div className="inline-flex items-center gap-2 bg-primary-light/80 text-primary-dark px-6 py-3 rounded-full font-extrabold text-sm md:text-base mb-8 shadow-sm border border-primary/20 backdrop-blur-sm animate-float">
             ✨ Welcome to the Future of Learning
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] mb-8 text-slate-800">
             Learning is Better with a <br className="hidden md:block" />
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
               Furry Friend! 🌸
             </span>
          </h1>
          <p className="text-lg md:text-2xl text-slate-500 font-medium mb-12 max-w-3xl leading-relaxed">
            The most adorable way to master Math, Science, and English. Join thousands of kittens worldwide on a quest for knowledge and leveling up.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
             <button className="btn-primary !py-5 !px-10 text-lg flex items-center justify-center gap-3 w-full sm:w-auto" onClick={() => router.push("/login")}>
                Get Started Today <span className="text-2xl">🐾</span>
             </button>
             <button className="btn-secondary !py-5 !px-10 text-lg flex items-center justify-center gap-3 w-full sm:w-auto" onClick={handleDownload}>
                Download App <span className="text-2xl">📱</span>
             </button>
          </div>
        </div>
        
        {/* Floating Hero Icons */}
        <div className="absolute top-[20%] left-[10%] text-6xl opacity-20 animate-float-slow pointer-events-none hidden lg:block">📚</div>
        <div className="absolute top-[30%] right-[10%] text-6xl opacity-20 animate-float pointer-events-none hidden lg:block">🎮</div>
        <div className="absolute bottom-[20%] left-[15%] text-6xl opacity-20 animate-float-slower pointer-events-none hidden lg:block">🌟</div>
      </header>

      {/* Features Section */}
      <section className="relative z-10 py-24 px-6 bg-white/40 backdrop-blur-lg border-y border-slate-200/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
             <h2 className="text-4xl md:text-5xl font-black mb-4 text-slate-800">Why Choose Cat Academy? <span className="inline-block animate-pulse-soft">🌟</span></h2>
             <p className="text-xl text-slate-500 font-medium">Built for curious kittens who love to explore and learn together.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="premium-card text-center hover:-translate-y-2 transition-transform duration-300">
               <div className="text-6xl mb-6 inline-block bg-primary-light/50 p-6 rounded-[2rem] shadow-inner">🎮</div>
               <h3 className="text-2xl font-black mb-4 text-slate-800">Gamified Learning</h3>
               <p className="text-slate-500 font-medium leading-relaxed">Every quiz is an adventure! Earn EXP, collect badges, and level up as you master your subjects.</p>
            </div>
            <div className="premium-card text-center hover:-translate-y-2 transition-transform duration-300 delay-100">
               <div className="text-6xl mb-6 inline-block bg-secondary/10 p-6 rounded-[2rem] shadow-inner">📚</div>
               <h3 className="text-2xl font-black mb-4 text-slate-800">Full Curriculum</h3>
               <p className="text-slate-500 font-medium leading-relaxed">From K to Grade 6, covering Math, Science, English, Filipino, and more with feline flair.</p>
            </div>
            <div className="premium-card text-center hover:-translate-y-2 transition-transform duration-300 delay-200">
               <div className="text-6xl mb-6 inline-block bg-accent/10 p-6 rounded-[2rem] shadow-inner">📊</div>
               <h3 className="text-2xl font-black mb-4 text-slate-800">Admin Tools</h3>
               <p className="text-slate-500 font-medium leading-relaxed">Teachers can create custom tests and track every student's progress with real-time analytics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 container mx-auto py-24 px-6 max-w-5xl">
         <div className="glass-card flex flex-col md:flex-row justify-between gap-12 text-center py-12 px-8">
             <div className="flex-1">
                <h2 className="text-6xl font-black text-primary mb-2 drop-shadow-sm">{studentCount}</h2>
                <p className="text-lg font-bold text-slate-500 uppercase tracking-wider">Kitten Students <span className="ml-1">😸</span></p>
             </div>
             <div className="hidden md:block w-px bg-slate-200"></div>
             <div className="flex-1">
                <h2 className="text-6xl font-black text-accent-blue mb-2 drop-shadow-sm">{totalSubjects}+</h2>
                <p className="text-lg font-bold text-slate-500 uppercase tracking-wider">Fun Subjects <span className="ml-1">📚</span></p>
             </div>
             <div className="hidden md:block w-px bg-slate-200"></div>
             <div className="flex-1">
                <h2 className="text-6xl font-black text-secondary-color mb-2 drop-shadow-sm">{successRate}%</h2>
                <p className="text-lg font-bold text-slate-500 uppercase tracking-wider">Success Rate <span className="ml-1">🎓</span></p>
             </div>
         </div>
      </section>

      {/* CTA Footer */}
      <footer className="relative overflow-hidden bg-gradient-to-br from-secondary to-primary py-32 px-6 text-center text-white">
         <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20 border-t border-white/10"></div>
         {/* Huge subtle cat background */}
         <div className="absolute -left-20 -bottom-20 text-[30rem] opacity-5 pointer-events-none select-none rotate-[-15deg]">🐱</div>
         
         <div className="relative z-10 container mx-auto max-w-4xl">
            <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight drop-shadow-lg">
                Ready to Unleash Your Inner Genius? 🧠
            </h2>
            <p className="text-xl md:text-2xl mb-12 font-medium opacity-90 drop-shadow-md">
                Join our premium kitten community today!
            </p>
            <button className="bg-white text-primary hover:bg-primary-light px-12 py-5 rounded-full text-xl font-extrabold shadow-2xl hover:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.5)] transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3 mx-auto" onClick={() => router.push("/login")}>
               Get Started Now <span className="text-2xl">🐾</span>
            </button>
         </div>
      </footer>
    </div>
  );
}
