"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { curriculum } from "@/data/curriculum";

export default function SubjectHome() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [localCurriculum, setLocalCurriculum] = useState(curriculum);
  const grade = decodeURIComponent(params.grade);
  const subjectTitle = decodeURIComponent(params.subject);

  useEffect(() => {
    const fetchData = async () => {
      const storedUser = localStorage.getItem("catUser");
      if (!storedUser) {
        router.push("/");
        return;
      }
      setUser(JSON.parse(storedUser));
      
      try {
        const u = JSON.parse(storedUser);
        const res = await fetch(`/api/curriculum?userId=${u.id}&role=${u.role}`);
        if (res.ok) {
          const currData = await res.json();
          const baseCurr = { ...curriculum };
          Object.keys(currData).forEach(g => {
            if (!baseCurr[g]) baseCurr[g] = [];
            currData[g].forEach(subj => {
              const existing = baseCurr[g].find(s => s.title === subj.title);
              if (existing) {
                existing.lessons = [...existing.lessons, ...subj.lessons];
              } else {
                baseCurr[g].push(subj);
              }
            });
          });
          setLocalCurriculum(baseCurr);
        }
      } catch (e) {
        console.error("Failed to sync curriculum", e);
      }
    };
    fetchData();
  }, [router, grade]);

  if (!user) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  // Normalize subject title for better matching (Math-101 vs Math 101)
  const normalizedSubjectTitle = subjectTitle.replace(/-/g, ' ');

  let subjectData = (localCurriculum[grade] || []).find((s) => s.title === subjectTitle) ||
                    (localCurriculum[grade] || []).find((s) => s.title === normalizedSubjectTitle);

  // Fallback: search ALL grades if not found 
  if (!subjectData) {
    Object.keys(localCurriculum).forEach(g => {
       const found = localCurriculum[g].find(s => s.title === subjectTitle || s.title === normalizedSubjectTitle);
       if (found) subjectData = found;
    });
  }

  if (!subjectData) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-8xl mb-6">😿</div>
      <h2 className="text-3xl font-black text-slate-800 mb-2">Subject Missing</h2>
      <p className="text-slate-500 mb-8 max-w-md">The scroll you're looking for seems to have been misplaced by the library cats.</p>
      <button className="btn-primary !px-8" onClick={() => router.push("/dashboard")}>Back to Safety 🏠</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-paper relative overflow-hidden">
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[15%] w-[40rem] h-[40rem] bg-primary-light/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[35rem] h-[35rem] bg-accent-blue/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-6 py-12 md:py-20 max-w-5xl">
        <button 
          className="group flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest mb-12 hover:text-primary transition-colors"
          onClick={() => router.push("/dashboard")}
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Dashboard
        </button>

        <header className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/50 backdrop-blur-sm border border-slate-100 rounded-full shadow-sm">
                 <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{grade} Academy</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tight">{subjectTitle} <span className="text-primary-light/50">Curriculum</span></h1>
              <p className="text-lg font-medium text-slate-400 max-w-2xl leading-relaxed">Embark on your scholarly journey. Complete all modules to earn your certification.</p>
           </div>
           
           <div className="hidden md:flex flex-col items-end">
              <div className="text-4xl mb-2">{subjectData.icon || "📂"}</div>
              <p className="font-black text-slate-700 text-sm">{subjectData.lessons?.length || 0} Modules Total</p>
           </div>
        </header>
        
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          {subjectData.lessons.map((lesson, index) => (
            <div 
              key={lesson.id} 
              className={`premium-card group !p-6 md:!p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer border-none shadow-xl ${lesson.type === 'final' ? 'bg-gradient-to-br from-indigo-50 to-white ring-2 ring-indigo-500/20' : 'bg-white/80 backdrop-blur-md'}`}
              onClick={() => router.push(`/lessons/${grade}/${subjectTitle}/${lesson.id}`)}
            >
              <div className="flex items-center gap-6 md:gap-8">
                 <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner transition-transform group-hover:scale-110 duration-500 ${lesson.type === 'lecture' ? 'bg-slate-50 text-slate-600' : (lesson.type === 'quiz' ? 'bg-indigo-50 text-indigo-500' : 'bg-primary text-white shadow-xl shadow-primary/30')}`}>
                    {lesson.type === 'lecture' ? '📖' : (lesson.type === 'quiz' ? index + 1 : '🏆')}
                 </div>
                 <div>
                   <h3 className="text-lg md:text-xl font-black text-slate-800 mb-1 leading-tight group-hover:text-primary transition-colors">{lesson.title}</h3>
                   <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {lesson.type === 'lecture' ? 'Module Study' : (lesson.type === 'quiz' ? 'Knowledge Check' : 'Final Graduation')}
                      </span>
                      {lesson.type === 'final' && (
                        <span className="px-2 py-0.5 bg-indigo-500 text-white text-[9px] font-black rounded-md uppercase tracking-widest shadow-sm">Special</span>
                      )}
                   </div>
                 </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-100 pt-6 md:pt-0">
                 <div className="flex flex-col md:items-end">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Time Estimate</p>
                    <p className="text-xs font-bold text-slate-500">{lesson.type === 'lecture' ? '15-20 min' : '10 min'}</p>
                 </div>
                 <button className={`btn-primary !py-3 !px-8 !text-xs !shadow-none group-hover:!shadow-lg group-hover:!shadow-primary/20 transition-all ${lesson.type === 'lecture' ? '!bg-slate-800' : ''}`}>
                   {lesson.type === "lecture" ? "Review" : "Start"} 🐾
                 </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 pt-12 border-t border-slate-200/50 flex flex-col items-center">
           <div className="p-8 glass-panel border-dashed border-2 border-slate-100 text-center max-w-lg">
              <div className="text-4xl mb-4">🎓</div>
              <p className="text-sm font-bold text-slate-500 leading-relaxed italic">
                "The more that you read, the more things you will know. The more that you learn, the more places you'll go."
              </p>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-4">— Dr. Seuss for Kittens —</p>
           </div>
        </div>
      </div>
    </div>
  );
}
