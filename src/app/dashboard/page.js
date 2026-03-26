"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const headmasterIdRef = useRef(null);

  useEffect(() => {
    const channel = supabase.channel('academy-events');
    
    channel.on('broadcast', { event: 'nuclear_reset' }, () => {
      localStorage.removeItem("catUser");
      window.location.href = "/";
    });

    channel.on('broadcast', { event: 'freeze' }, ({ payload }) => {
       if (headmasterIdRef.current && String(payload.headmasterId) === String(headmasterIdRef.current)) {
         setIsExpired(true);
       }
    });

    channel.on('broadcast', { event: 'unfreeze' }, ({ payload }) => {
       if (headmasterIdRef.current && String(payload.headmasterId) === String(headmasterIdRef.current)) {
         setIsExpired(false);
       }
    });

    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);
  const [joinCode, setJoinCode] = useState("");
  const [allSubjects, setAllSubjects] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [expiryDate, setExpiryDate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const storedUser = localStorage.getItem("catUser");
      if (!storedUser) {
        router.push("/");
        return;
      }
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (parsedUser.role === 'Creator') {
        router.push("/creator");
        return;
      }

      try {
        const userRes = await fetch(`/api/users/${parsedUser.id}`);
        const userLatest = await userRes.json();
        if (userLatest && userLatest.role && userLatest.role !== parsedUser.role) {
           const updated = { ...parsedUser, role: userLatest.role };
           localStorage.setItem("catUser", JSON.stringify(updated));
           setUser(updated);
        }

        const activeRole = (userLatest && userLatest.role) || parsedUser.role || 'Student';

        if (activeRole !== 'Creator') {
          const allURes = await fetch("/api/users");
          const allUData = await allURes.json();
          if (Array.isArray(allUData)) {
            let myHeadmaster = null;
            if (activeRole === 'Headmaster') myHeadmaster = userLatest || parsedUser;
            else {
              const myInviter = allUData.find(u => String(u.id) === String(userLatest?.invited_by || parsedUser.invited_by));
              if (myInviter?.role === 'Headmaster') myHeadmaster = myInviter;
              else if (myInviter?.role === 'Teacher') {
                myHeadmaster = allUData.find(u => String(u.id) === String(myInviter.invited_by) && u.role === 'Headmaster');
              }
            }

            if (myHeadmaster && myHeadmaster.id) {
               headmasterIdRef.current = myHeadmaster.id;
            }

            if (myHeadmaster && myHeadmaster.subscription_expires_at) {
              const now = new Date();
              const exp = new Date(myHeadmaster.subscription_expires_at);
              if (now > exp) {
                setIsExpired(true);
                setExpiryDate(exp.toLocaleDateString());
                setLoading(false);
                return;
              }
            }
          }
        }
        const currRes = await fetch(`/api/curriculum?userId=${parsedUser.id}&role=${activeRole}`);
        const currData = await currRes.json();
        
        const storedProgress = JSON.parse(localStorage.getItem("catProgress") || "{}");
        setProgress(storedProgress);

        if (currData.error) {
          setAllSubjects([]);
          return;
        }

        const subjects = [];
        Object.keys(currData).forEach(grade => {
          if (!Array.isArray(currData[grade])) return;
          currData[grade].forEach(subj => {
            subjects.push({ ...subj, grade });
          });
        });
        const annRes = await fetch(`/api/announcements?grade=${parsedUser.grade}`);
        const annData = await annRes.json();
        if (Array.isArray(annData)) setAnnouncements(annData);
        
        setAllSubjects(subjects);

        const notifs = [];
        annData.slice(0, 5).forEach(a => {
          notifs.push({ id: `ann-${a.id}`, type: 'announcement', title: "New Bulletin", message: a.content.substring(0, 40) + "...", date: a.created_at });
        });
        subjects.forEach(s => {
          (s.lessons || []).forEach(l => {
             const isNew = (new Date() - new Date(l.created_at || Date.now())) < 3 * 24 * 60 * 60 * 1000;
             if (isNew) {
               notifs.push({ id: `lesson-${l.id}`, type: 'lesson', title: `New in ${s.title}`, message: l.title, date: l.created_at });
             }
          });
        });
        setNotifications(notifs.sort((a,b) => new Date(b.date) - new Date(a.date)));

      } catch (e) { 
        console.error("Data fetch failed", e); 
        setAllSubjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const syncInterval = setInterval(fetchData, 15000);
    return () => clearInterval(syncInterval);
  }, [router]);

  const handleJoinSubject = async () => {
    if (!joinCode || !user) return;
    try {
      const response = await fetch("/api/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          joinSubjectCode: joinCode.toUpperCase()
        })
      });

      const data = await response.json();
      if (data.success) {
        alert("🎉 Success! You've joined the class!");
        window.location.reload();
      } else throw new Error(data.error);
    } catch (e) { alert("Invalid Code! 😿 " + e.message); }
  };

  if (!user || loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary-light/40 filter blur-[100px] blob-shape animate-float"></div>
        <div className="relative text-6xl animate-bounce mb-4">🐾</div>
        <div className="text-xl font-black text-slate-400 tracking-widest uppercase">Loading Academy...</div>
    </div>
  );

  if (isExpired) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-200/30 filter blur-[80px] blob-shape"></div>
        <div className="premium-card max-w-lg w-full text-center border-2 border-red-200 shadow-2xl relative z-10 transition-all">
           <div className="text-8xl mb-6">🔒🏫</div>
           <h2 className="text-3xl font-black text-red-500 mb-4">School Access Paused</h2>
           <p className="text-slate-600 font-medium leading-relaxed mb-8">
              Our school's access was paused on <strong className="text-red-400">{expiryDate}</strong>. 🐾 <br />
              Don't worry kitten! Your progress is safe. Check back again once your Teacher or Headmaster is ready!
           </p>
           <button className="btn-secondary w-full" onClick={() => router.push("/")}>Return to Explorer 🚪</button>
        </div>
      </div>
    );
  }

  const getProgressPercent = (subj) => {
    const subjProgress = progress[subj.grade]?.[subj.title] || [];
    if (!subj.lessons || subj.lessons.length === 0) return 0;
    return Math.round((subjProgress.length / subj.lessons.length) * 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden font-sans pb-24">
      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-primary-light/40 mix-blend-multiply filter blur-[100px] blob-shape opacity-60"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] bg-secondary/10 mix-blend-multiply filter blur-[80px] blob-shape animation-delay-2000 opacity-50"></div>
      </div>
      
      <div className="container mx-auto px-6 pt-10 relative z-10">
        <header className="premium-card !p-10 !bg-gradient-to-br from-primary to-accent text-white mb-10 overflow-hidden relative shadow-2xl">
          <div className="absolute right-[-20px] top-[-20px] text-[15rem] opacity-10 pointer-events-none select-none rotate-12">🐱</div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-5xl font-black drop-shadow-sm">Hi, {user.name}!</h1>
                <button 
                  title="Sync Data" 
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-md transition-all active:scale-95 text-xl"
                  onClick={() => window.location.reload()}
                >
                  🔄
                </button>
              </div>
              <p className="text-lg md:text-xl font-medium opacity-90 drop-shadow-sm">Welcome back to your <strong className="font-extrabold">{user.grade}</strong> room!</p>
            </div>
            
            <div className="flex items-center gap-4">
               <button 
                  onClick={() => setShowAnnouncements(true)}
                  className="w-14 h-14 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center relative transition-all active:scale-95 group"
               >
                  <span className="text-2xl group-hover:scale-110 transition-transform">📣</span>
                  {announcements.length > 0 && (
                    <div className="absolute -top-2 -right-2 bg-white text-primary rounded-full w-7 h-7 flex items-center justify-center font-black text-xs border-2 border-primary shadow-lg animate-bounce">
                        {announcements.length}
                    </div>
                  )}
               </button>
               
               <button 
                  onClick={() => setShowNotifications(true)}
                  className="w-14 h-14 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center relative transition-all active:scale-95 group"
               >
                  <span className="text-2xl group-hover:scale-110 transition-transform">🔔</span>
                  {notifications.length > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-400 text-white rounded-full w-7 h-7 flex items-center justify-center font-black text-xs border-2 border-white shadow-lg">
                        {notifications.length}
                    </div>
                  )}
               </button>

               <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 text-center flex flex-col items-center">
                  <span className="text-[10px] font-black uppercase tracking-[3px] opacity-80 mb-0.5">Kitten Level</span>
                  <span className="text-3xl font-black">{user.level}</span>
               </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4 relative z-10 pt-8 border-t border-white/20">
             <div className="flex-1 w-full md:w-auto glass-panel !bg-white/20 backdrop-blur-xl border-white/30 flex items-center p-1.5 rounded-full shadow-inner ring-1 ring-white/10 group focus-within:ring-white/40 transition-all">
                <input 
                  type="text" 
                  placeholder="Have an invite code? ✨" 
                  className="flex-1 w-0 bg-transparent border-none text-white placeholder:text-white/60 px-4 md:px-6 font-bold outline-none uppercase tracking-widest text-xs md:text-sm" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                />
                <button 
                  className="bg-white text-primary px-6 md:px-8 py-2 md:py-3 rounded-full font-black text-xs md:text-sm uppercase tracking-widest hover:bg-slate-50 transition-all shadow-lg active:scale-95 shrink-0"
                  onClick={handleJoinSubject}
                >
                  Join 🏫
                </button>
             </div>
             
             <div className="overflow-x-auto no-scrollbar">
               <div className="flex gap-3">
                 {(user.role === 'Headmaster' || user.role === 'Teacher') && (
                   <button className="btn-secondary !bg-indigo-600/20 !text-white !border-white/20 hover:!bg-indigo-600/40 !backdrop-blur-md" onClick={() => router.push("/admin")}>
                      Admin Panel 👑
                   </button>
                 )}
                 <button className="btn-secondary !bg-white/10 !text-white !border-white/10 hover:!bg-red-500/20 !backdrop-blur-md" onClick={() => { localStorage.removeItem("catUser"); router.push("/"); }}>
                    Logout 🚪
                 </button>
               </div>
             </div>
          </div>
        </header>

        {/* Featured Announcement */}
        {announcements.length > 0 && (
          <div className="glass-card mb-10 !p-6 border-l-[6px] border-l-yellow-400 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 animate-fade-in group hover:bg-white/60 items-start">
            <div className="hidden md:flex w-16 h-16 bg-yellow-400/10 rounded-2xl items-center justify-center text-3xl group-hover:scale-110 transition-transform">📜</div>
            <div className="flex-1 w-full overflow-hidden">
               <span className="text-[10px] font-black uppercase text-yellow-600 tracking-widest mb-1 block flex items-center gap-2"><span className="md:hidden">📜</span> Headmaster's Bulletin</span>
               <div className="relative overflow-hidden">
                  <p className="font-bold text-slate-700 md:truncate md:line-clamp-1">{announcements[0].content}</p>
               </div>
            </div>
            <button className="w-full md:w-auto btn-secondary !py-2.5 !px-6 !text-xs !bg-white hover:!bg-yellow-50 !border-yellow-200 !text-yellow-600" onClick={() => alert(announcements[0].content)}>
              Full Message 🔍
            </button>
          </div>
        )}

        {/* Subjects List */}
        <div className="flex items-end justify-between mb-8 px-2">
           <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Your Subjects <span className="text-primary">📚</span></h2>
              <p className="text-slate-500 font-medium mt-1">Ready for today's adventure?</p>
           </div>
           <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-[2px]">Enrolled Subjects</span>
              <span className="text-2xl font-black text-slate-600">{allSubjects.length}</span>
           </div>
        </div>

        {allSubjects.length === 0 ? (
          <div className="premium-card p-8 md:p-20 text-center animate-fade-in group">
             <div className="text-6xl md:text-[10rem] mb-6 grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">📭</div>
             <h3 className="text-2xl font-black text-slate-700 mb-2">No subjects yet!</h3>
             <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed px-4 md:px-0">
                {user.role === 'Student' 
                  ? "Don't worry kitten! Ask your teacher for an invite code and enter it above to start learning." 
                  : "Welcome Educator! Head to the Admin Panel to create your first official subject!"}
             </p>
             <button className="btn-primary mt-8" onClick={() => { if(user.role !== 'Student') router.push("/admin"); else document.querySelector('input').focus(); }}>
               {user.role === 'Student' ? "Ready to Join! 🐾" : "Create Subject 🗺️"}
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allSubjects.map((subj) => {
              const pct = getProgressPercent(subj);
              const isPub = subj.is_public;

              return (
                <div 
                  key={subj.id} 
                  className={`premium-card group cursor-pointer hover:-translate-y-2 !transition-all duration-300 relative overflow-hidden ${isPub ? 'border-2 border-yellow-400/40 shadow-[0_10px_40px_rgba(251,191,36,0.15)] bg-gradient-to-b from-white to-yellow-50/30' : ''}`}
                  onClick={() => router.push(`/classroom/${subj.id}`)}
                >
                  <div className={`p-8 rounded-[1.8rem] mb-6 relative overflow-hidden text-center transition-all ${isPub ? 'bg-gradient-to-br from-yellow-50 to-yellow-100/50' : 'bg-gradient-to-br from-primary-light to-secondary/5'}`}>
                      {isPub && <div className="absolute top-4 right-4 text-2xl drop-shadow-sm">👑</div>}
                      <span className="text-7xl block mb-2 group-hover:scale-110 transition-transform duration-500 relative z-10">{subj.icon}</span>
                      <div className="absolute -bottom-6 -right-6 text-[8rem] opacity-[0.03] rotate-[-15deg] group-hover:rotate-0 transition-transform duration-700 pointer-events-none">{subj.icon}</div>
                      
                      {/* Progress Circle Snail in corner? No, let's stick to bar */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/50 text-[10px] font-black text-slate-500 uppercase">
                          <span className={pct === 100 ? 'text-green-500' : 'text-primary'}>{pct}%</span> Complete
                      </div>
                  </div>

                  <div className="flex justify-between items-start gap-4 mb-2">
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none truncate group-hover:text-primary transition-colors">{subj.title}</h3>
                      {isPub && <span className="shrink-0 bg-yellow-400 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">Official</span>}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-6">
                      <span className="text-xs font-bold text-slate-400 bg-slate-100/80 px-2 py-1 rounded-md">{subj.grade}</span>
                      <span className="text-xs font-bold text-slate-400">•</span>
                      <span className="text-xs font-bold text-slate-400">{subj.lessons?.length || 0} Lessons</span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-6 relative border border-slate-50">
                      <div 
                        className={`h-full transition-all duration-1000 ease-out rounded-full ${pct === 100 ? 'bg-green-400' : (isPub ? 'bg-yellow-400' : 'bg-primary')}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                  </div>

                  <button className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${isPub ? 'bg-yellow-400/10 text-yellow-600 hover:bg-yellow-400 hover:text-white' : 'btn-secondary shadow-none !border-slate-100'}`}>
                    {pct === 100 ? "Mastered! ✨" : (isPub ? "Enter Classroom 👑" : "Start Learning 🐾")}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODALS */}
      {(showAnnouncements || showNotifications) && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex justify-center items-end md:items-center p-0 md:p-6 animate-fade-in" 
          onClick={() => { setShowAnnouncements(false); setShowNotifications(false); }}
        >
           <div 
              className="premium-card !p-0 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] rounded-t-[2.5rem] md:rounded-[2.5rem] animate-slide-up"
              onClick={e => e.stopPropagation()}
           >
              <div className={`p-6 md:p-8 flex items-center justify-between text-white ${showAnnouncements ? 'bg-amber-500' : 'bg-indigo-500'}`}>
                  <div className="flex items-center gap-4">
                     <span className="text-3xl md:text-4xl">{showAnnouncements ? "📣" : "🔔"}</span>
                     <div>
                        <h2 className="text-xl md:text-2xl font-black">{showAnnouncements ? "Bulletins" : "Updates"}</h2>
                        <p className="text-[10px] md:text-sm opacity-90 font-medium uppercase tracking-wider">Academy Hall</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => { setShowAnnouncements(false); setShowNotifications(false); }} 
                    className="w-10 h-10 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center font-bold text-xl backdrop-blur-sm transition-colors"
                  >
                    ✕
                  </button>
              </div>

               <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white/95 no-scrollbar">
                  {showAnnouncements ? (
                    <div className="space-y-4">
                       {announcements.length === 0 ? <div className="text-center py-10 text-slate-300 font-bold">No announcements yet</div> : 
                        announcements.map(a => (
                          <div key={a.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[1.8rem] transition-all hover:bg-white hover:shadow-md hover:border-slate-200">
                             <div className="text-[10px] font-black uppercase text-amber-600 tracking-[2px] mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                {new Date(a.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                             </div>
                             <p className="text-slate-700 font-medium leading-[1.65] text-lg">{a.content}</p>
                          </div>
                        ))
                       }
                    </div>
                  ) : (
                    <div className="space-y-4">
                       {notifications.length === 0 ? <div className="text-center py-10 text-slate-300 font-bold">All caught up! ✨</div> : 
                        notifications.map(n => (
                          <div key={n.id} className="p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex gap-5 items-start group hover:bg-white hover:shadow-md transition-all">
                             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform shrink-0">
                                {n.type === 'announcement' ? '🖋️' : '📚'}
                             </div>
                             <div className="flex-1 pt-0.5">
                                <div className="flex justify-between items-start mb-1">
                                   <h4 className="font-extrabold text-slate-800">{n.title}</h4>
                                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(n.date).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">{n.message}</p>
                             </div>
                          </div>
                        ))
                       }
                    </div>
                  )}
              </div>
              
              <div className="p-8 bg-slate-50/50 border-t border-slate-100 text-center">
                  <button 
                    className="btn-secondary !bg-white !shadow-sm hover:!bg-slate-50 w-full"
                    onClick={() => { setShowAnnouncements(false); setShowNotifications(false); }}
                  >
                    Got it, thanks! 😺
                  </button>
              </div>
           </div>
        </div>
      )}

      <style jsx>{`
        .animate-slide-up {
           animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
           from { transform: translateY(100%); opacity: 0; }
           to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
