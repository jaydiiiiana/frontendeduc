"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { curriculum } from "@/data/curriculum";
import { calculateLevel } from "@/lib/xp";

export default function ScholarLessonPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [localCurriculum, setLocalCurriculum] = useState(curriculum);
  
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const grade = params.grade ? decodeURIComponent(params.grade) : "";
  const subjectTitle = params.subject ? decodeURIComponent(params.subject) : "";
  const lessonId = params.lesson_id;

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
        
        // 1. Direct Fetch for Lesson Data (Source of Truth)
        const lessonRes = await fetch(`/api/lessons/${lessonId}?userId=${u.id}&role=${u.role}`);
        if (lessonRes.ok) {
           const lessonData = await lessonRes.json();
           // Update local curriculum with this lesson's context
           const baseCurr = { ...localCurriculum };
           const g = lessonData.subjects.grade;
           if (!baseCurr[g]) baseCurr[g] = [];
           const existingIdx = baseCurr[g].findIndex(s => s.id === lessonData.subject_id);
           if (existingIdx >= 0) {
             const existingLessons = baseCurr[g][existingIdx].lessons || [];
             if (!existingLessons.some(l => l.id === lessonData.id)) {
               baseCurr[g][existingIdx].lessons = [...existingLessons, lessonData];
             }
           } else {
             baseCurr[g].push({
               ...lessonData.subjects,
               id: lessonData.subject_id,
               lessons: [lessonData]
             });
           }
           setLocalCurriculum(baseCurr);
        } else {
           const errData = await lessonRes.json();
           setErrorMsg(errData.error || "Module Access Restricted");
        }

        // 2. Sync full curriculum
        const res = await fetch(`/api/curriculum?userId=${u.id}&role=${u.role}`);
        if (res.ok) {
          const currData = await res.json();
          const baseCurr = { ...curriculum };
          Object.keys(currData).forEach(g => {
            if (!baseCurr[g]) baseCurr[g] = [];
            baseCurr[g] = [...baseCurr[g], ...currData[g]];
          });
          if (JSON.stringify(localCurriculum) !== JSON.stringify(baseCurr)) setLocalCurriculum(baseCurr);
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

  const subjectsInGrade = localCurriculum[grade] || [];
  
  // Normalize subject title for better matching (Math-101 vs Math 101)
  const normalizedSubjectTitle = subjectTitle.replace(/-/g, ' ');

  let subjectData = subjectsInGrade.find(s => s.lessons?.some(l => String(l.id) === String(lessonId))) || 
                    subjectsInGrade.find(s => s.title === subjectTitle) ||
                    subjectsInGrade.find(s => s.title === normalizedSubjectTitle);

  // Fallback: search ALL grades if not found (in case of grade mismatch)
  if (!subjectData) {
    console.log(`[LessonLookup] Not found in grade ${grade}. Searching all grades...`);
    Object.keys(localCurriculum).forEach(g => {
       const found = localCurriculum[g].find(s => s.lessons?.some(l => String(l.id) === String(lessonId)));
       if (found) {
         console.log(`[LessonLookup] Found in grade ${g}!`);
         subjectData = found;
       }
    });
  }

  if (subjectData) {
    console.log(`[LessonLookup] Match found: ${subjectData.title} (ID: ${subjectData.id})`);
  } else {
    console.warn(`[LessonLookup] FAILED to find subject for lessonId: ${lessonId}, title: ${subjectTitle}`);
  }
  
  const lessonsInSubject = subjectData?.lessons || [];
  const lesson = lessonsInSubject.find(l => String(l.id) === String(lessonId));
  const lessonIdx = lessonsInSubject.findIndex(l => String(l.id) === String(lessonId));

  useEffect(() => {
    if (lesson && lesson.type === "quiz") {
      const currentProgress = JSON.parse(localStorage.getItem("catProgress") || "{}");
      const isDone = currentProgress[grade]?.[subjectTitle]?.includes(lessonId);
      if (isDone) {
        setFinished(true);
        setAlreadyDone(true);
      }
    }
  }, [lesson, grade, subjectTitle, lessonId]);

  if (!lesson) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
      <div className="premium-card max-w-md w-full !p-12 shadow-2xl border-none">
        <div className="text-8xl mb-6">😿</div>
        <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Module Unreachable</h2>
        <p className="text-slate-500 font-medium leading-relaxed mb-8">
          {errorMsg ? errorMsg : `The scroll for lesson #${lessonId} (${subjectTitle}) is missing from your curriculum.`} <br />
          <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest mt-4 block">Please ensure you are enrolled in this subject.</span>
        </p>
        <button className="btn-primary w-full shadow-xl shadow-primary/20" onClick={() => router.push(`/dashboard`)}>Back to Dashboard 🏠</button>
      </div>
    </div>
  );

  const saveProgress = () => {
    const currentProgress = JSON.parse(localStorage.getItem("catProgress") || "{}");
    if (!currentProgress[grade]) currentProgress[grade] = {};
    if (!currentProgress[grade][subjectTitle]) currentProgress[grade][subjectTitle] = [];
    if (!currentProgress[grade][subjectTitle].includes(lessonId.toString())) {
      currentProgress[grade][subjectTitle].push(lessonId.toString());
    }
    localStorage.setItem("catProgress", JSON.stringify(currentProgress));
  };

  const handleAnswer = async (option) => {
    if (isAnswered) return;
    setSelected(option);
    setIsAnswered(true);
    
    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIndex: qIndex, answer: option })
      });
      const data = await res.json();
      setCorrectAnswer(data.correctAnswer);
      // Ensure comparison is flexible (string vs string)
      if (data.correct || String(option) === String(data.correctAnswer)) setScore(score + 10);
    } catch (e) {
      console.error("Answer check failed", e);
    }
  };

  const handleNextInQuiz = () => {
    const questions = lesson.questions || [];
    if (qIndex < questions.length - 1) {
      setQIndex(qIndex + 1);
      setSelected(null);
      setIsAnswered(false);
      setCorrectAnswer(null);
    } else {
      setFinished(true);
      saveProgress();
      const totalExp = (user.exp || 0) + score;
      const newLevel = calculateLevel(totalExp);
      const updatedUser = { ...user, exp: totalExp, level: newLevel };
      localStorage.setItem("catUser", JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Sync to database
      fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: user.id, exp: totalExp, level: newLevel })
      }).catch(e => console.error("Stats sync failed", e));
    }
  };

  const goToLesson = (id) => {
    router.push(`/lessons/${grade}/${subjectTitle}/${id}`);
    setSidebarOpen(false);
    setQIndex(0); setScore(0); setFinished(false); setSelected(null); setIsAnswered(false); setCorrectAnswer(null);
  };

  const getYoutubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="min-h-screen bg-bg-paper flex overflow-hidden">
      
      {/* Sidebar - Modern Glass */}
      <aside className={`fixed inset-y-0 left-0 w-80 bg-white/80 backdrop-blur-xl border-r border-slate-100 z-50 transform transition-transform duration-500 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-8 border-b border-slate-100 bg-gradient-to-tr from-primary-light/10 to-transparent">
           <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Scholar's Path</h2>
           <h3 className="text-xl font-black text-slate-800 line-clamp-1">{subjectTitle}</h3>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-120px)] scrollbar-hide">
          {lessonsInSubject.map((l, idx) => (
            <button 
              key={l.id} 
              onClick={() => goToLesson(l.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${l.id == lessonId ? 'bg-white shadow-xl shadow-primary-light/10 ring-1 ring-primary-light text-primary' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${l.id == lessonId ? 'bg-primary text-white' : 'bg-slate-100'}`}>
                {idx + 1}
              </div>
              <span className={`text-sm font-bold truncate ${l.id == lessonId ? 'opacity-100' : 'opacity-70'}`}>{l.title}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Context */}
      <main className="flex-1 lg:ml-80 h-screen overflow-y-auto scroll-smooth">
        
        {/* Top Navigation */}
        <nav className="sticky top-0 z-30 bg-white/60 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl shadow-sm text-slate-500"
              >
                ☰
              </button>
              <div className="hidden sm:block">
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{grade} • Curriculum</p>
                 <p className="text-xs font-bold text-slate-600 line-clamp-1">{lesson.title}</p>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <button className="btn-secondary !py-2 !px-4 !text-[10px]" onClick={() => router.push(`/lessons/${grade}/${subjectTitle}`)}>
                 Exit Path
              </button>
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center text-xs font-black shadow-lg shadow-primary/20">
                 {score || 0}
              </div>
           </div>
        </nav>

        {/* Lesson Progress (Top) */}
        {!finished && lesson.type === 'quiz' && (
           <div className="h-1 w-full bg-slate-100">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${((qIndex + 1) / (lesson.questions?.length || 1)) * 100}%` }}
              />
           </div>
        )}

        <article className="max-w-4xl mx-auto px-6 py-12 md:py-16">
           
           {lesson.type === "lecture" ? (
             <div className="animate-fade-in">
                <header className="mb-12">
                   <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight mb-6">{lesson.title}</h1>
                   <div className="flex items-center gap-4">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">Theoretical Module</span>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Estimated 15 mins</span>
                   </div>
                </header>

                <div className="space-y-10">
                   {lesson.media_url && (
                      <div className="rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 bg-slate-100 ring-1 ring-slate-100">
                         {getYoutubeVideoId(lesson.media_url) ? (
                            <div className="aspect-video">
                               <iframe 
                                  className="w-full h-full"
                                  src={`https://www.youtube.com/embed/${getYoutubeVideoId(lesson.media_url)}`}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                               ></iframe>
                            </div>
                         ) : (
                            <img src={lesson.media_url} alt={lesson.title} className="w-full h-auto" />
                         )}
                      </div>
                   )}

                   <div className="glass-panel !p-8 md:!p-12 border-none shadow-xl shadow-slate-100/50">
                      <div className="prose prose-slate max-w-none text-slate-700 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                        {lesson.content}
                      </div>
                   </div>
                </div>
             </div>
           ) : (
             <section className="animate-fade-in">
                {finished ? (
                  <div className="text-center py-20">
                     <div className="inline-flex items-center justify-center w-24 h-24 bg-green-50 text-green-500 rounded-full text-5xl mb-8 animate-bounce transition-transform duration-1000">🎉</div>
                     <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-4">Module Mastered!</h2>
                     <p className="text-slate-500 font-medium mb-12 max-w-md mx-auto">
                        {alreadyDone ? "You've successfully reviewed this examination. Excellent persistence!" : `Magnificent! You scored ${score} EXP for your profile.`}
                     </p>
                     
                     <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="btn-primary !py-4 !px-10" onClick={() => {
                           if (lessonIdx < lessonsInSubject.length - 1) goToLesson(lessonsInSubject[lessonIdx+1].id);
                           else router.push(`/dashboard`);
                        }}>
                           {lessonIdx < lessonsInSubject.length - 1 ? "Advance to Next Chapter 🐾" : "Return to Dashboard"}
                        </button>
                        <button className="text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-primary transition-colors" onClick={() => setFinished(false)}>Review Questions</button>
                     </div>
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto">
                    <header className="mb-12 text-center">
                       <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Question {qIndex + 1} of {lesson.questions?.length || 0}</p>
                       <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-snug">{lesson.questions?.[qIndex]?.q || "Processing Analysis..."}</h3>
                    </header>

                    <div className="grid grid-cols-1 gap-4">
                      {(lesson.questions?.[qIndex]?.options || []).map((opt, i) => {
                        const isCorrect = opt === correctAnswer;
                        const isSelected = selected === opt;
                        const stateClass = isAnswered 
                           ? (isCorrect ? 'ring-2 ring-green-500 bg-green-50 text-green-700' : (isSelected ? 'ring-2 ring-red-500 bg-red-50 text-red-700' : 'opacity-40'))
                           : 'hover:ring-2 hover:ring-primary-light hover:bg-white hover:-translate-y-0.5';

                        return (
                          <button 
                            key={i} 
                            className={`premium-card group !p-6 flex items-center justify-between text-left transition-all duration-300 border-none shadow-md ${stateClass}`}
                            onClick={() => handleAnswer(opt)}
                            disabled={isAnswered}
                          >
                            <span className="font-bold">{opt}</span>
                            {isAnswered && isCorrect && <span className="text-xl">✅</span>}
                            {isAnswered && isSelected && !isCorrect && <span className="text-xl">❌</span>}
                          </button>
                        );
                      })}
                    </div>

                    {isAnswered && (
                      <div className="mt-12 animate-slide-up">
                         <button className="btn-primary w-full !py-5 shadow-2xl shadow-primary/20 flex items-center justify-center gap-3" onClick={handleNextInQuiz}>
                           {qIndex < lesson.questions.length - 1 ? "Advance Strategy ➔" : "Finalize Results 🏆"}
                         </button>
                      </div>
                    )}
                  </div>
                )}
             </section>
           )}

           {/* Navigation Footer */}
           <footer className="mt-24 pt-12 border-t border-slate-100 flex items-center justify-between gap-4">
              <button 
                className="group flex items-center gap-3 text-slate-400 hover:text-primary transition-colors"
                disabled={lessonIdx === 0}
                onClick={() => goToLesson(lessonsInSubject[lessonIdx-1].id)}
              >
                <div className={`w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all ${lessonIdx === 0 ? 'opacity-20' : ''}`}>❮</div>
                <div className="hidden sm:block text-left">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Previous Module</p>
                   <p className="text-xs font-bold truncate max-w-[120px]">{(lessonsInSubject[lessonIdx-1] || {}).title || 'Start'}</p>
                </div>
              </button>

              <button 
                className="group flex items-center gap-3 text-right"
                onClick={() => {
                  if (lesson.type === "lecture") {
                    saveProgress();
                    // Award Reading EXP (10 points)
                    const totalExp = (user.exp || 0) + 10;
                    const newLevel = calculateLevel(totalExp);
                    const updatedUser = { ...user, exp: totalExp, level: newLevel };
                    localStorage.setItem("catUser", JSON.stringify(updatedUser));
                    setUser(updatedUser);

                    // Sync to database
                    fetch(`/api/users/${user.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ requesterId: user.id, exp: totalExp, level: newLevel })
                    }).catch(e => console.error("Stats sync failed", e));
                  }
                  if (lessonIdx < lessonsInSubject.length - 1) goToLesson(lessonsInSubject[lessonIdx+1].id);
                  else router.push(`/lessons/${grade}/${subjectTitle}`);
                }}
              >
                <div className="hidden sm:block">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Next Step</p>
                   <p className="text-xs font-bold truncate max-w-[120px]">{lessonIdx < lessonsInSubject.length - 1 ? lessonsInSubject[lessonIdx+1].title : 'Complete'}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center group-hover:bg-primary transition-all">❯</div>
              </button>
           </footer>
        </article>
      </main>
    </div>
  );
}
