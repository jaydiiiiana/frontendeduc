"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CreatorPanel() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [invites, setInvites] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const channelRef = useRef(null);

  useEffect(() => {
    // Initialize Realtime Channel
    const channel = supabase.channel('academy-events');
    channel.subscribe();
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);
  const [headmasters, setHeadmasters] = useState([]);
  const [duration, setDuration] = useState(1);
  const [renewDuration, setRenewDuration] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const stored = localStorage.getItem("catUser");
        if (!stored) { 
          router.push("/"); 
          return; 
        }
        
        const user = JSON.parse(stored);
        if (!user || (user.role !== 'Creator' && user.name !== 'admin_cat')) {
          alert("Wait! Only the original Creator can enter this chamber. 🐾🚪");
          router.push("/dashboard");
          return;
        }
        
        setCurrentUser(user);

        const [invRes, uRes] = await Promise.all([
          fetch(`/api/invites?userId=${user.id}`),
          fetch("/api/users")
        ]);
        
        let invData = [];
        if (invRes.ok) {
           invData = await invRes.json();
        }
        
        let uData = [];
        if (uRes.ok) {
           uData = await uRes.json();
        }
        
        setInvites(Array.isArray(invData) ? invData : []);
        
        if (Array.isArray(uData)) {
          const hmList = uData.filter(u => u.role === 'Headmaster');
          const hmWithStats = hmList.map(hm => {
            const teachers = uData.filter(u => u.role === 'Teacher' && u.invited_by === hm.id);
            const teacherIds = teachers.map(t => t.id);
            const groupStudents = uData.filter(u => u.role === 'Student' && (u.invited_by === hm.id || teacherIds.includes(u.invited_by)));
            
            return {
              ...hm,
              teacherCount: teachers.length,
              studentCount: groupStudents.length
            };
          });
          setHeadmasters(hmWithStats);
        }
      } catch (e) { 
        console.error("Initialization failed:", e); 
      } finally {
        setLoading(false);
      }
    };

    init();
    const syncInterval = setInterval(init, 15000);
    return () => clearInterval(syncInterval);
  }, [router]);

  const renewSubscription = async (hmId, months) => {
    try {
      const res = await fetch("/api/admin/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, targetUserId: hmId, months: parseInt(months) })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setHeadmasters(headmasters.map(hm => hm.id === hmId ? { ...hm, subscription_expires_at: data.newExpiry } : hm));
      alert("Subscription renewed successfully! 👑✅");
    } catch (e) { alert("Renewal Failed: " + e.message); }
  };

  const freezeSubscription = async (hmId) => {
    if (!confirm("❄️ FREEZE SCHOOL: This will instantly block the Headmaster and all their students from accessing the dashboard. Proceed?")) return;
    try {
      const res = await fetch("/api/admin/freeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, targetUserId: hmId })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setHeadmasters(headmasters.map(hm => hm.id === hmId ? { ...hm, subscription_expires_at: data.newExpiry } : hm));
      // Broadcast Freeze Event
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'freeze',
          payload: { headmasterId: hmId }
        });
      }
      alert(`Academy Access FROZEN for ID: ${hmId} ❄️🏫`);
    } catch (e) { alert("Freeze Failed: " + e.message); }
  };

  const generateHeadmasterCode = async () => {
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, roleToGrant: 'Headmaster', durationMonths: parseInt(duration) })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInvites([data, ...invites]);
      alert(`New ${duration}-month Headmaster code generated! 👑🎫`);
    } catch (e) { alert("Error: " + e.message); }
  };

  const resetEverything = async () => {
    if (!confirm("🚨 WARNING: This will permanently DELETE all students, teachers, subjects, and lessons. Only your Creator account will survive. Are you absolutely sure?")) return;
    if (!confirm("FINAL CONFIRMATION: Are you really sure? This cannot be undone!")) return;
    
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert(data.message);
      window.location.reload();
    } catch (e) { alert("Reset Failed: " + e.message); }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="font-black text-[10px] uppercase tracking-widest opacity-50">Accessing Secret Chamber...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 relative overflow-x-hidden selection:bg-primary/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none top-0">
         <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-primary/5 rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute bottom-0 left-0 w-[50rem] h-[50rem] bg-indigo-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-7xl relative z-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 animate-fade-in">
           <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-6 shadow-2xl">
                 <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Founder Protocol Active</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">Creator <span className="text-primary-light/40 italic">Workspace</span></h1>
              <p className="text-lg font-medium text-slate-400/80 mt-2">Oversee the growth and integrity of the Academy network.</p>
           </div>
           
           <div className="flex items-center gap-4">
              <button 
                onClick={() => { localStorage.removeItem("catUser"); router.push("/"); }}
                className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white hover:bg-white/10 transition-all"
              >
                Terminate Session
              </button>
           </div>
        </header>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16 animate-slide-up">
           <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] shadow-2xl">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Total Schools</p>
              <h2 className="text-4xl font-black text-white">{headmasters.length}</h2>
           </div>
           <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] shadow-2xl">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Active Staff</p>
              <h2 className="text-4xl font-black text-white">{headmasters.reduce((acc, hm) => acc + (hm.teacherCount || 0), 0)}</h2>
           </div>
           <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] shadow-2xl md:col-span-2 bg-gradient-to-br from-primary/10 to-transparent">
              <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-4">Total Scholar Population</p>
              <h2 className="text-4xl font-black text-white">{headmasters.reduce((acc, hm) => acc + (hm.studentCount || 0), 0)} <span className="text-lg opacity-40 font-normal ml-2">Registered Kittens</span></h2>
           </div>
        </div>

        {/* Main Content Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          
          {/* Schools Management */}
          <div className="lg:col-span-2 space-y-8">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-2xl font-black text-white tracking-tight">Active Faculty Licenses</h3>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Real-time Sync</span>
             </div>

             <div className="grid grid-cols-1 gap-6">
                {headmasters.map(hm => {
                  const isExpired = hm.subscription_expires_at && new Date(hm.subscription_expires_at) < new Date();
                  return (
                    <div key={hm.id} className={`group bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/[0.08] transition-all shadow-xl ${isExpired ? 'ring-1 ring-red-500/20' : ''}`}>
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                          <div className="flex items-center gap-6">
                             <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner ${isExpired ? 'bg-red-500/10 text-red-400' : 'bg-primary/20 text-primary'}`}>
                                {(hm.name || "S")[0].toUpperCase()}
                             </div>
                             <div>
                                <h4 className="text-xl font-black text-white mb-1 group-hover:text-primary transition-colors">{hm.name}</h4>
                                <div className="flex items-center gap-3">
                                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">School ID: {String(hm.id || "").slice(0, 8)}</span>
                                   <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm ${isExpired ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                                      {isExpired ? 'Frozen' : 'Verified'}
                                   </span>
                                </div>
                             </div>
                          </div>
                          
                          <div className="flex items-center justify-between w-full md:w-auto gap-6 sm:gap-10">
                             <div className="text-center">
                                <p className="text-2xl font-black text-white leading-none mb-2">{hm.teacherCount}</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Faculty</p>
                             </div>
                             <div className="text-center">
                                <p className="text-2xl font-black text-white leading-none mb-2">{hm.studentCount}</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Students</p>
                             </div>
                          </div>
                       </div>

                       <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="space-y-1">
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">License Expiry</p>
                             <p className="text-sm font-bold text-white">{hm.subscription_expires_at ? new Date(hm.subscription_expires_at).toLocaleDateString() : 'Perpetual Access'}</p>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                             <select 
                               className="bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-xs font-black text-white focus:ring-2 ring-primary/40 outline-none transition-all"
                               value={renewDuration}
                               onChange={(e) => setRenewDuration(e.target.value)}
                             >
                                <option value="1">1 Month</option>
                                <option value="3">3 Months</option>
                                <option value="6">6 Months</option>
                                <option value="12">1 Year</option>
                             </select>
                             <button className="px-6 py-3 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all" onClick={() => renewSubscription(hm.id, renewDuration)}>Renew</button>
                             <button className="px-6 py-3 bg-white/5 border border-red-500/30 text-red-400 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all" onClick={() => freezeSubscription(hm.id)}>Freeze</button>
                          </div>
                       </div>
                    </div>
                  );
                })}
                {headmasters.length === 0 && (
                   <div className="p-20 border-2 border-dashed border-white/5 rounded-[2rem] text-center">
                      <p className="text-4xl mb-4 opacity-10">🏢</p>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest italic">The network is currently silent.</p>
                   </div>
                )}
             </div>
          </div>

          {/* Controls & Invites */}
          <div className="space-y-8">
             <div className="bg-gradient-to-br from-primary/20 to-slate-800 p-8 rounded-[2rem] border border-primary/20 shadow-2xl">
                <h4 className="text-xl font-black text-white mb-6">Issue Enrollment Code</h4>
                <div className="space-y-4 mb-8">
                   <p className="text-sm font-medium text-slate-400 italic">Generate standard verification codes for new school owners.</p>
                   <select 
                     className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:ring-2 ring-primary/50 transition-all"
                     value={duration}
                     onChange={(e) => setDuration(e.target.value)}
                   >
                     <option value="1">1 Month Pilot</option>
                     <option value="3">3 Month Quarter</option>
                     <option value="6">6 Month Semester</option>
                     <option value="12">1 Year Academy</option>
                   </select>
                </div>
                <button className="w-full btn-primary !py-5 shadow-2xl" onClick={generateHeadmasterCode}>Forge Join Code 🎫</button>
             </div>

             <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] shadow-2xl">
                <h4 className="text-xl font-black text-white mb-6">Archive of Tokens</h4>
                <div className="space-y-4">
                   {invites.filter(inv => !inv.is_used).map((inv, i) => (
                     <div key={i} className="flex items-center justify-between p-4 bg-slate-800 rounded-2xl border border-white/5 group">
                        <div>
                           <p className="text-xs font-black text-primary font-mono tracking-widest mb-1">{inv.code}</p>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                             {(() => {
                               const expiryDate = new Date(new Date(inv.created_at).getTime() + 24 * 60 * 60 * 1000);
                               const timeLeft = expiryDate.getTime() - new Date().getTime();
                               const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                               const minsLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                               return timeLeft > 0 ? `Expires in: ${hoursLeft}h ${minsLeft}m` : "Expired";
                             })()}
                           </p>
                        </div>
                        <button 
                          onClick={() => { if (typeof navigator !== 'undefined') { navigator.clipboard.writeText(inv.code); alert("Code Transferred! 🎫"); } }}
                          className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-primary transition-all"
                        >
                           📋
                        </button>
                     </div>
                   ))}
                   {invites.filter(inv => !inv.is_used).length === 0 && (
                      <p className="text-xs font-bold text-slate-600 italic text-center py-4">No active codes in registry.</p>
                   )}
                </div>
             </div>

             <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-[2rem] group hover:bg-red-500/10 transition-all">
                <h4 className="text-lg font-black text-red-400 mb-2">Nuclear Protocol</h4>
                <p className="text-xs text-red-400/60 mb-8 font-medium italic">Instantly wipe all data nodes in the network. Irreversible.</p>
                <button className="w-full py-4 border border-red-500/40 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-red-500 hover:text-white transition-all" onClick={resetEverything}>
                   Activate Global Wipe (RESET) 🧨
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
