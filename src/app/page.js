"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
   const router = useRouter();
   const [totalUsers, setTotalUsers] = useState(0);
   const [totalSchools, setTotalSchools] = useState(0);
   const [totalSubjects, setTotalSubjects] = useState(0);
   const [successRate, setSuccessRate] = useState(0);
   const [user, setUser] = useState(null);
   const [stories, setStories] = useState([]);
   const [ratingData, setRatingData] = useState({ average: 0, count: 0 });
   const [newStory, setNewStory] = useState("");
   const [showEnrollModal, setShowEnrollModal] = useState(false);
   const [selectedPlan, setSelectedPlan] = useState(null);
   const [enrollmentForm, setEnrollmentForm] = useState({
      schoolName: "",
      contactPerson: "",
      preferredDate: "",
      preferredTime: "",
      meetingType: "Zoom",
      notes: ""
   });
   const [enrollStatus, setEnrollStatus] = useState({ loading: false, success: false });
   const deferredPrompt = useRef(null);

   useEffect(() => {
      // Check if user is logged in for nav
      const stored = localStorage.getItem("catUser");
      if (stored) setUser(JSON.parse(stored));

      const fetchStats = async () => {
         try {
            const res = await fetch("/api/public/stats");
            const data = await res.json();
            setTotalUsers(data.totalUsers || 2);
            setTotalSchools(data.totalSchools || 1);
            setTotalSubjects(data.totalSubjects || 5);
            setSuccessRate(data.successRate || 95);
         } catch (e) { setTotalUsers(2); setTotalSchools(1); setTotalSubjects(5); setSuccessRate(95); }
      };
      fetchStats();

      const fetchStories = async () => {
         try {
            const res = await fetch("/api/public/success-stories");
            const data = await res.json();
            setStories(data || []);
         } catch (e) { console.error(e); }
      };
      
      const fetchRatings = async () => {
         try {
            const res = await fetch("/api/public/ratings");
            const data = await res.json();
            setRatingData(data || { average: 0, count: 0 });
         } catch (e) { console.error(e); }
      };

      fetchStories();
      fetchRatings();

      // Listen for PWA install prompt
      const handler = (e) => {
         e.preventDefault();
         deferredPrompt.current = e;
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
   }, []);

   const handleEnrollSubmit = (e) => {
      e.preventDefault();
      setEnrollStatus({ loading: true, success: false });
      // Simulation of submission
      setTimeout(() => {
         setEnrollStatus({ loading: false, success: true });
         setTimeout(() => {
            setShowEnrollModal(false);
            setEnrollStatus({ loading: false, success: false });
            setEnrollmentForm({ schoolName: "", contactPerson: "", preferredDate: "", preferredTime: "", meetingType: "Zoom", notes: "" });
         }, 3000);
      }, 1500);
   };

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
      <div className="min-h-screen overflow-x-hidden bg-slate-50 relative font-sans text-slate-800">
         {/* Animated Background Blobs */}
         <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-light/40 mix-blend-multiply filter blur-[80px] blob-shape opacity-70"></div>
            <div className="absolute top-[40%] right-[-5%] w-[600px] h-[600px] bg-secondary/10 mix-blend-multiply filter blur-[100px] blob-shape animation-delay-2000 opacity-60"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-primary-light/20 mix-blend-multiply filter blur-[60px] blob-shape animation-delay-4000 opacity-50"></div>
         </div>

         {/* Navigation */}
         <nav className="fixed w-full top-0 px-6 md:px-12 py-4 flex justify-between items-center z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 shadow-sm transition-all">
            <div className="text-xl md:text-2xl font-black flex items-center gap-3 text-primary">
               <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-slate-100 bg-white">
                  <img src="/cat-hat-logo.png" alt="Cat Academy" className="w-full h-full object-cover" />
               </div>
               Cat Academy
            </div>
            <div className="flex gap-2 md:gap-4 items-center">
               <button className="hidden md:block px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:text-primary hover:bg-slate-50 transition-colors" onClick={() => router.push("/login")}>Login</button>
               <button className="btn-primary !px-6 !py-2.5 !text-xs md:!text-base flex items-center gap-2" onClick={() => router.push("/login")}>
                  Join Now <span className="text-base md:text-lg">🎓</span>
               </button>
            </div>
         </nav>

         {/* Hero Section */}
         <header className="relative z-10 container mx-auto px-6 pt-32 md:pt-48 pb-20 flex flex-col items-center min-h-[85vh] text-center max-w-5xl">
            <div className="animate-fade-in flex flex-col items-center w-full">
               <div className="inline-flex items-center gap-2 bg-primary/5 text-primary px-6 py-3 rounded-full font-extrabold text-xs md:text-sm mb-8 shadow-sm border border-primary/10 backdrop-blur-sm animate-float">
                  ✨ Welcome to the Premier Learning Academy
               </div>
               <h1 className="text-4xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] mb-8 text-slate-800">
                  Excellence Begins with a <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                     Curious Spirit. 🎓
                  </span>
               </h1>
               <p className="text-base md:text-2xl text-slate-500 font-medium mb-12 max-w-3xl leading-relaxed">
                  The most professional way to master Math, Science, and English. Join a global community dedicated to academic excellence and feline-fueled success.
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
                  <div className="premium-card text-center hover:-translate-y-2 group transition-all duration-300">
                     <div className="text-6xl mb-6 inline-block bg-primary/5 p-6 rounded-[2rem] shadow-inner group-hover:bg-primary/10 group-hover:scale-110 transition-all">🎮</div>
                     <h3 className="text-2xl font-black mb-4 text-slate-800">Academic Ranking</h3>
                     <p className="text-slate-500 font-medium leading-relaxed">Every quiz is a milestone! Earn EXP, collect honors, and climb the leaderboard as you master your subjects.</p>
                  </div>
                  <div className="premium-card text-center hover:-translate-y-2 group transition-all duration-300">
                     <div className="text-6xl mb-6 inline-block bg-accent/5 p-6 rounded-[2rem] shadow-inner group-hover:bg-accent/10 group-hover:scale-110 transition-all">📊</div>
                     <h3 className="text-2xl font-black mb-4 text-slate-800">Faculty Insights</h3>
                     <p className="text-slate-500 font-medium leading-relaxed">Faculty can create rigorous assessments and track student performance with real-time academic analytics.</p>
                  </div>
                  <div className="premium-card text-center hover:-translate-y-2 group transition-all duration-300">
                     <div className="text-6xl mb-6 inline-block bg-secondary/5 p-6 rounded-[2rem] shadow-inner group-hover:bg-secondary/10 group-hover:scale-110 transition-all">🏫</div>
                     <h3 className="text-2xl font-black mb-4 text-slate-800">Global Campus</h3>
                     <p className="text-slate-500 font-medium leading-relaxed">Our scholarly community is here to support you. Connect with peers and educators in an elite learning environment.</p>
                  </div>
               </div>
            </div>
         </section>

         {/* Stats Section */}
         <section className="relative z-10 container mx-auto py-24 px-6 max-w-5xl">
            <div className="glass-card flex flex-col md:flex-row justify-between gap-12 text-center py-12 px-8 bg-white border-2 border-primary/5">
               <div className="flex-1">
                  <h2 className="text-6xl font-black text-primary mb-2 drop-shadow-sm">{totalSchools}</h2>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-[2px]">Affiliated Schools <span className="ml-1">🏫</span></p>
               </div>
               <div className="hidden md:block w-px bg-slate-100"></div>
               <div className="flex-1">
                  <h2 className="text-6xl font-black text-primary mb-2 drop-shadow-sm">{totalUsers}</h2>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-[2px]">Scholar Kittens <span className="ml-1">😸</span></p>
               </div>
               <div className="hidden md:block w-px bg-slate-100"></div>
               <div className="flex-1">
                  <h2 className="text-6xl font-black text-primary mb-2 drop-shadow-sm">{successRate}%</h2>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-[2px]">Passing Grade <span className="ml-1">🎓</span></p>
               </div>
            </div>
         </section>

         {/* Pricing Section */}
         <section id="pricing" className="relative z-10 py-24 px-6 bg-slate-50/50">
            <div className="container mx-auto max-w-6xl">
               <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-black mb-4 text-slate-800">Choose Your Plan 💎</h2>
                  <p className="text-xl text-slate-500 font-medium">Unlock the full potential of Cat Academy today.</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                     { name: 'Trial', duration: '1 Month', price: 'Free', color: 'primary' },
                     { name: 'Standard', duration: '3 Months', price: '₱250', color: 'primary' },
                     { name: 'Premium', duration: '6 Months', price: '₱450', color: 'primary' },
                     { name: 'Annual', duration: '1 Year', price: '₱800', color: 'primary', popular: true }
                  ].map((p, i) => (
                     <div key={p.name} className={`premium-card relative flex flex-col items-center p-8 border-2 ${p.popular ? 'border-primary/20 bg-primary/[0.02]' : 'border-transparent'}`}>
                        {p.popular && <span className="absolute -top-4 bg-primary text-white px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Preferred Choice</span>}
                        <h3 className="text-2xl font-black mb-2 text-slate-800">{p.name}</h3>
                        <p className="text-slate-400 font-extrabold uppercase tracking-widest text-[10px] mb-6">{p.duration}</p>
                        <div className="text-4xl font-black text-primary mb-8">{p.price}</div>
                        <ul className="text-slate-500 text-sm font-bold space-y-3 mb-8 text-center opacity-80">
                           <li className="flex items-center gap-2 justify-center">✅ Full Roster Access</li>
                           <li className="flex items-center gap-2 justify-center">✅ Advanced Analytics</li>
                           <li className="flex items-center gap-2 justify-center">✅ Official Certification</li>
                        </ul>
                        <button 
                          className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${p.popular ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 text-slate-500 hover:bg-primary/10 hover:text-primary'}`}
                          onClick={() => { setSelectedPlan(p); setShowEnrollModal(true); }}
                        >
                           Enroll Now
                        </button>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* Enrollment Modal */}
         {showEnrollModal && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
              <div className="premium-card !p-0 max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-3xl border-none animate-scale-in flex flex-col">
                 {/* Modal Header */}
                 <div className="bg-primary p-8 text-white relative">
                    <button 
                      onClick={() => setShowEnrollModal(false)}
                      className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-xl"
                    >
                       ✕
                    </button>
                    <p className="text-[10px] font-black uppercase tracking-[3px] opacity-70 mb-2">Academic Onboarding</p>
                    <h3 className="text-3xl font-black tracking-tight">Schedule Your Enrollment Meeting</h3>
                    <p className="text-sm font-medium opacity-80 mt-2">Request a session for the <span className="underline decoration-secondary decoration-2 underline-offset-4">{selectedPlan?.name} Plan</span> to verify your school registry.</p>
                 </div>

                 {/* Modal Body */}
                 <div className="p-8 overflow-y-auto no-scrollbar flex-1 bg-white border-t border-slate-100">
                    {enrollStatus.success ? (
                       <div className="py-12 text-center animate-fade-in flex flex-col items-center">
                          <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner animate-bounce-slow">✅</div>
                          <h4 className="text-2xl font-black text-slate-800 mb-2">Request Transmitted!</h4>
                          <p className="text-slate-500 font-medium max-w-xs mx-auto">Your academic concierge will contact you within 24 hours to confirm the {enrollmentForm.meetingType} meeting. 🐾</p>
                       </div>
                    ) : (
                       <form onSubmit={handleEnrollSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Official School Name</label>
                                <input 
                                   required
                                   type="text" 
                                   className="input-field !py-4 !bg-slate-50 border-slate-100 focus:!bg-white" 
                                   placeholder="e.g. St. Catherine Academy" 
                                   value={enrollmentForm.schoolName}
                                   onChange={(e) => setEnrollmentForm({...enrollmentForm, schoolName: e.target.value})}
                                />
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Contact Representative</label>
                                <input 
                                   required
                                   type="text" 
                                   className="input-field !py-4 !bg-slate-50 border-slate-100 focus:!bg-white" 
                                   placeholder="Full Name" 
                                   value={enrollmentForm.contactPerson}
                                   onChange={(e) => setEnrollmentForm({...enrollmentForm, contactPerson: e.target.value})}
                                />
                             </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Meeting Date</label>
                                <input 
                                   required
                                   type="date" 
                                   className="input-field !py-4 !bg-slate-50 border-slate-100 focus:!bg-white" 
                                   value={enrollmentForm.preferredDate}
                                   onChange={(e) => setEnrollmentForm({...enrollmentForm, preferredDate: e.target.value})}
                                />
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Preferred Time</label>
                                <input 
                                   required
                                   type="time" 
                                   className="input-field !py-4 !bg-slate-50 border-slate-100 focus:!bg-white" 
                                   value={enrollmentForm.preferredTime}
                                   onChange={(e) => setEnrollmentForm({...enrollmentForm, preferredTime: e.target.value})}
                                />
                             </div>
                          </div>

                          <div className="space-y-4">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Meeting Environment</label>
                             <div className="flex gap-4">
                                {["Zoom", "Personal"].map(type => (
                                   <button
                                      key={type}
                                      type="button"
                                      onClick={() => setEnrollmentForm({...enrollmentForm, meetingType: type})}
                                      className={`flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-3 ${enrollmentForm.meetingType === type ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                   >
                                      {type === 'Zoom' ? '💻 Online Zoom' : '🤝 Personal Meet'}
                                   </button>
                                ))}
                             </div>
                          </div>

                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Preparation & Requirements</label>
                             <textarea 
                                className="input-field !rounded-3xl !py-4 min-h-[100px] resize-none !bg-slate-50 border-slate-100 focus:!bg-white" 
                                placeholder="What have you prepared for the meeting? (e.g. valid IDs, school permits)" 
                                value={enrollmentForm.notes}
                                onChange={(e) => setEnrollmentForm({...enrollmentForm, notes: e.target.value})}
                             />
                          </div>

                          <button 
                            disabled={enrollStatus.loading}
                            className="btn-primary w-full !py-5 shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                          >
                             {enrollStatus.loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                             ) : (
                                <>Request Onboarding Meeting 🚀</>
                             )}
                          </button>
                       </form>
                    )}
                 </div>
              </div>
           </div>
         )}

         {/* Success Stories Section */}
         <section id="success-stories" className="relative z-10 py-24 px-6 bg-white">
            <div className="container mx-auto max-w-4xl">
               <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-black mb-4 text-slate-800">Alumni Success 🎓</h2>
                  <p className="text-xl text-slate-500 font-medium mb-4">Voices from our esteemed academic community.</p>
                  
                  {/* Rating Display */}
                  <div className="flex flex-col items-center gap-2">
                     <div className="flex gap-1 text-3xl text-accent">
                        {[1, 2, 3, 4, 5].map(s => (
                           <span key={s} className={s <= ratingData.average ? "opacity-100" : "opacity-30"}>★</span>
                        ))}
                     </div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{ratingData.average} / 5 ({ratingData.count} Scholar Ratings)</p>
                     
                     {user && (
                        <div className="mt-4 flex flex-col items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                           <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider">Submit Your Academic Rating:</p>
                           <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map(s => (
                                 <button 
                                    key={s} 
                                    onClick={async () => {
                                       await fetch("/api/ratings", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ userId: user.id, rating: s })
                                       });
                                       const res = await fetch("/api/public/ratings");
                                       const d = await res.json();
                                       setRatingData(d);
                                    }}
                                    className="text-2xl hover:scale-125 transition-transform origin-center"
                                 >
                                    ★
                                 </button>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
               </div>

               {/* Post Story (Faculty only) */}
               {user?.role === 'Headmaster' && (
                  <div className="premium-card mb-12 border-primary/20 bg-primary/[0.02]">
                     <h4 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                        Document a Success Story <span className="text-2xl">📖</span>
                     </h4>
                     <textarea 
                        className="w-full p-4 rounded-2xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-slate-600 mb-4"
                        placeholder="Tell us about a learning breakthrough..."
                        rows="4"
                        value={newStory}
                        onChange={(e) => setNewStory(e.target.value)}
                     ></textarea>
                     <button 
                        onClick={async () => {
                           if (!newStory) return;
                           const res = await fetch("/api/success-stories", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ content: newStory, authorId: user.id })
                           });
                           if (res.ok) {
                              setNewStory("");
                              const updated = await fetch("/api/public/success-stories");
                              const d = await updated.json();
                              setStories(d);
                           }
                        }}
                        className="btn-primary !py-4 !px-8 shadow-lg shadow-primary/20"
                     >
                        Post Story 🎉
                     </button>
                  </div>
               )}

               {/* Stories List */}
               <div className="space-y-8">
                  {stories.length > 0 ? stories.map((s, i) => (
                     <div key={i} className="premium-card !p-8 border-slate-100 hover:border-primary/20 transition-all">
                        <p className="text-lg text-slate-600 font-medium leading-relaxed mb-6 italic">"{s.content}"</p>
                        <div className="flex justify-between items-center border-t border-slate-50 pt-6">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center font-black text-primary">
                                 {s.users?.name?.charAt(0) || '🎓'}
                              </div>
                              <div>
                                 <p className="text-sm font-black text-slate-800">{s.users?.name || "Headmaster"}</p>
                                 <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Shared on {new Date(s.created_at).toLocaleDateString()}</p>
                              </div>
                           </div>
                           <button 
                              onClick={async () => {
                                 const res = await fetch("/api/success-stories", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ storyId: s.id, action: 'like' })
                                 });
                                 if (res.ok) {
                                    const updated = await fetch("/api/public/success-stories");
                                    const d = await updated.json();
                                    setStories(d);
                                 }
                              }}
                              className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 text-slate-400 font-black text-xs hover:bg-primary-light hover:text-primary transition-all group"
                           >
                              <span className="group-hover:scale-125 transition-transform">🐾</span> {s.likes || 0} Likes
                           </button>
                        </div>
                     </div>
                  )) : (
                     <div className="text-center py-12 opacity-50 grayscale">
                        <div className="text-6xl mb-4">😿</div>
                        <p className="font-black text-slate-400 uppercase tracking-widest">No success stories yet. Check back soon!</p>
                     </div>
                  )}
               </div>
            </div>
         </section>

         {/* Comprehensive Educational Footer */}
         <footer className="relative bg-white pt-24 pb-12 border-t border-slate-100 overflow-hidden">
            {/* Subtle pattern background */}
            <div className="absolute inset-x-0 bottom-0 h-96 bg-[radial-gradient(circle_at_bottom,rgba(255,107,158,0.05)_0%,transparent_70%)] pointer-events-none"></div>

            <div className="container mx-auto px-6 relative z-10">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                  {/* Brand Section */}
                  <div className="space-y-6">
                     <div className="flex items-center gap-3 text-2xl font-black text-slate-800">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-slate-100 bg-white">
                           <img src="/cat-hat-logo.png" alt="Cat Academy Logo" className="w-full h-full object-cover" />
                        </div>
                        Cat Academy
                     </div>
                     <p className="text-slate-500 font-medium leading-relaxed">
                        Empowering the next generation of scholars through adorable adventures. Our mission is to make learning the most delightful part of every kitten's day.
                     </p>
                     <div className="flex gap-4">
                        {['facebook', 'twitter', 'instagram', 'youtube'].map(s => (
                           <div key={s} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-primary-light hover:text-white transition-all cursor-pointer">
                              <span className="text-lg opacity-60">●</span>
                           </div>
                        ))}
                     </div>
                  </div>

                   <div>
                      <h4 className="text-xs font-black uppercase tracking-[2px] text-slate-400 mb-8 mt-2">Navigation</h4>
                      <ul className="space-y-4">
                        {['Dashboard', 'About Us', 'Pricing', 'Success Stories'].map(link => (
                           <li key={link}>
                              <span className="text-slate-600 font-bold hover:text-primary transition-colors cursor-pointer" onClick={() => {
                                 const id = link.toLowerCase().replace(/\s+/g, '-');
                                 const el = document.getElementById(id);
                                 if (el) el.scrollIntoView({ behavior: 'smooth' });
                                 else if (link === 'Dashboard') window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}>{link}</span>
                           </li>
                        ))}
                      </ul>
                   </div>

                  {/* Contact Hub */}
                  <div>
                     <h4 className="text-xs font-black uppercase tracking-[2px] text-slate-400 mb-8 mt-2">Get in Touch</h4>
                     <ul className="space-y-6">
                        <li className="flex items-start gap-4">
                           <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-xl shrink-0">📍</div>
                           <p className="text-slate-600 font-bold leading-tight">Alley 3 Pasan Valenzuela City </p>
                        </li>
                        <li className="flex items-center gap-4 group">
                           <div className="w-10 h-10 rounded-xl bg-accent-blue/5 flex items-center justify-center text-xl shrink-0 group-hover:bg-accent-blue group-hover:text-white transition-colors">📞</div>
                           <a href="tel:+639458715697" className="text-slate-600 font-bold group-hover:text-accent-blue transition-colors">+63 9458715697</a>
                        </li>
                        <li className="flex items-center gap-4 group">
                           <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl shrink-0 group-hover:bg-green-500 group-hover:text-white transition-colors">✉️</div>
                           <a href="mailto:risingtechinnovations@gmail.com" className="text-slate-600 font-bold group-hover:text-green-500 transition-colors">risingtechinnovations@gmail.com</a>
                        </li>
                     </ul>
                  </div>

                  {/* Subscription/App info */}
                  <div className="glass-panel !p-8 !bg-slate-50 !border-slate-100 rounded-[2.5rem]">
                     <p className="text-[10px] font-black uppercase tracking-[2px] text-primary mb-2">Study Anywhere</p>
                     <h4 className="text-xl font-black text-slate-800 mb-4">Install the Academy App</h4>
                     <p className="text-sm text-slate-500 font-medium mb-6">Take your lessons offline and never miss a badge! 🐾</p>
                     <button className="w-full btn-primary !py-3 !text-xs !shadow-lg shadow-primary/20" onClick={() => alert("Check your browser address bar for the Install ⊕ icon!")}>
                        Install Now 📱
                     </button>
                  </div>
               </div>

               <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">© 2026 Cat Academy Project. All Rights Reserved.</p>
                  <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
                     <span className="hover:text-slate-800 cursor-pointer">Privacy Policy</span>
                     <span className="hover:text-slate-800 cursor-pointer">Terms of Service</span>
                     <span className="hover:text-slate-800 cursor-pointer">Cookie Settings</span>
                  </div>
               </div>
            </div>

            {/* Little cat sneaking from corner */}
            <div className="absolute right-[-10px] bottom-[-10px] text-8xl opacity-10 rotate-[-15deg] pointer-events-none select-none grayscale">🐱</div>
         </footer>
      </div>
   );
}
