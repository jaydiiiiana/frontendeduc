"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ScholarClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId;

  const [user, setUser] = useState(null);
  const [subject, setSubject] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stream");
  const [errorMessage, setErrorMessage] = useState("");
  const [progress, setProgress] = useState({});

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskType, setTaskType] = useState("lesson");
  const [taskData, setTaskData] = useState({ title: "", content: "", mediaUrl: "", questions: [{ q: "", options: ["", "", "", ""], a: "" }] });

  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem("catUser");
      if (!stored) { router.push("/"); return; }
      const parsed = JSON.parse(stored);
      setUser(parsed);

      const storedProgress = JSON.parse(localStorage.getItem("catProgress") || "{}");
      setProgress(storedProgress);

      try {
        const res = await fetch(`/api/classroom/${subjectId}?userId=${parsed.id}`);
        const data = await res.json();
        if (data.error) {
          setErrorMessage(data.error);
          setLoading(false);
          return;
        }
        setSubject(data.subject);
        setStudents(data.students || []);
      } catch (e) {
        console.error("Failed to load classroom", e);
        setErrorMessage(e.message);
      } finally { 
        setLoading(false); 
      }
    };
    init();
  }, [subjectId, router]);

  const isTeacher = user && (user.role === "Headmaster" || user.role === "Teacher");

  const handleCreateTask = async () => {
    if (!taskData.title) { alert("Please add a title! 🐾"); return; }
    try {
      const res = await fetch(`/api/classroom/${subjectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          type: taskType,
          title: taskData.title,
          content: taskData.content,
          mediaUrl: taskType === "lesson" ? taskData.mediaUrl : null,
          questions: taskType === "quiz" ? taskData.questions : null
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert("Task created! 🐾✅");
      window.location.reload();
    } catch (e) { alert("Error: " + e.message); }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!confirm("Remove this student from the class?")) return;
    try {
      const res = await fetch(`/api/classroom/${subjectId}/students/${studentId}?requesterId=${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStudents(students.filter(s => s.id !== studentId));
    } catch (e) { alert("Error: " + e.message); }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!subject) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-8xl mb-6">😿</div>
      <h2 className="text-3xl font-black text-slate-800 mb-2">Classroom Inaccessible</h2>
      <p className="text-slate-500 mb-8 max-w-md">{errorMessage || "You might need an invitation to enter this room."}</p>
      <button className="btn-primary !px-8" onClick={() => router.push("/dashboard")}>Back to Safety 🏠</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDF8F6] relative overflow-x-hidden">
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[15%] w-[40rem] h-[40rem] bg-primary-light/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[35rem] h-[35rem] bg-accent-blue/10 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      {/* Modern Header Banner */}
      <header className="relative bg-white/60 backdrop-blur-xl border-b border-slate-100 px-6 py-12 md:py-20 animate-fade-in overflow-hidden">
        <div className="container mx-auto max-w-6xl relative z-10">
           <button 
             onClick={() => router.push("/dashboard")}
             className="group inline-flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest mb-10 hover:text-primary transition-colors"
           >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Exit to Dashboard
           </button>
           
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
              <div className="space-y-6">
                 <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-5xl animate-float">
                    {subject.icon}
                 </div>
                 <div>
                    <div className="flex items-center gap-3 mb-2">
                       <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight leading-none">{subject.title}</h1>
                       <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">Active room</span>
                    </div>
                    <p className="text-lg font-medium text-slate-400">{subject.grade} • {subject.lessons?.length || 0} Learning Modules • {students.length} Fellow Kittens Enrolled</p>
                 </div>
              </div>

              {isTeacher && (
                <div className="glass-panel !p-6 !bg-primary/5 border-primary/10 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                  <div className="relative z-10">
                     <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-2">Subject Invite Token</p>
                     <p className="text-4xl font-black text-primary font-mono tracking-[0.2em] group-hover:scale-105 transition-transform duration-500">{subject.code}</p>
                  </div>
                  <div className="absolute -right-8 -bottom-8 text-9xl opacity-[0.03] group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 pointer-events-none">📜</div>
                </div>
              )}
           </div>
        </div>
      </header>

      {/* Floating Tab Navigation */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm animate-fade-in">
        <div className="container mx-auto max-w-6xl px-6 flex items-center justify-center gap-2 md:gap-10">
           {["stream", "classwork", "people"].map(tab => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-6 py-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
             >
               {tab}
               {activeTab === tab && (
                 <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full"></div>
               )}
             </button>
           ))}
        </div>
      </div>

      {/* Content Area */}
      <main className="container mx-auto max-w-6xl px-6 py-12 animate-slide-up">

        {activeTab === "stream" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar info card */}
            <div className="hidden lg:flex flex-col gap-6">
               <div className="premium-card !p-6 bg-white border-slate-100 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Classroom Code</h4>
                  <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-100 rounded-xl group/code">
                     <span className="text-xl font-black text-primary font-mono select-all decoration-dotted underline underline-offset-4">{subject.code}</span>
                     <button title="Copy Code" className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-primary transition-colors hover:scale-110" onClick={() => { navigator.clipboard.writeText(subject.code); alert("Code copied! 🐾"); }}>📋</button>
                  </div>
               </div>
               
               <div className="premium-card !p-6 bg-white border-slate-100 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Upcoming</h4>
                  <p className="text-xs font-medium text-slate-400 italic">No modules due soon. 🌤️</p>
                  <button className="text-[10px] font-black uppercase tracking-widest text-primary mt-6 hover:underline" onClick={() => setActiveTab('classwork')}>View All Modules</button>
               </div>
            </div>

            {/* Main Feed */}
            <div className="lg:col-span-3 space-y-6">
              {isTeacher && (
                 <div 
                   onClick={() => setActiveTab("classwork")}
                   className="w-full premium-card !p-6 flex items-center gap-6 group hover:shadow-xl transition-all border-none bg-white text-left cursor-pointer ring-1 ring-slate-100"
                 >
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-xl shadow-inner group-hover:bg-primary group-hover:text-white transition-colors">📣</div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600">Announce something to your kittens...</p>
                    </div>
                 </div>
              )}

              <div className="space-y-6">
                {(!subject.lessons || subject.lessons.length === 0) ? (
                  <div className="premium-card !p-20 text-center opacity-30 italic font-black uppercase tracking-widest bg-white border-none shadow-sm">
                    <div className="text-6xl mb-6">🌿</div>
                    The stream is quiet and peaceful.
                  </div>
                ) : (
                  [...subject.lessons].reverse().map((lesson) => (
                    <div 
                      key={lesson.id} 
                      className="premium-card group !p-6 md:!p-8 bg-white border-slate-100 hover:shadow-xl transition-all cursor-pointer shadow-sm relative overflow-hidden"
                      onClick={() => router.push(`/lessons/${subject.grade}/${subject.title}/${lesson.id}`)}
                    >
                       <div className="flex items-start gap-6 relative z-10">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm transition-transform group-hover:scale-110 ${lesson.type === 'quiz' ? 'bg-primary text-white' : 'bg-slate-800 text-white'}`}>
                             {lesson.type === 'quiz' ? '📝' : '📖'}
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                <h4 className="text-lg font-black text-slate-800 leading-tight truncate">{isTeacher ? "Creator posted a new module" : "New Material Available"}: <span className="text-primary">{lesson.title}</span></h4>
                                <span className="text-[10px] font-bold text-slate-400 shrink-0">{new Date(lesson.created_at || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</span>
                             </div>
                             <p className="text-sm text-slate-500 font-medium line-clamp-2 max-w-2xl leading-relaxed">
                                {lesson.type === 'quiz' ? 'A new examination has been scheduled to test your feline knowledge!' : (lesson.content ? lesson.content.substring(0, 150) + "..." : "A new reading module has been assigned to your scholars.")}
                             </p>
                          </div>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "classwork" && (
           <div className="animate-fade-in max-w-4xl mx-auto pb-24">
              <div className="flex items-center justify-between mb-12">
                 <h2 className="text-3xl font-black text-slate-800 tracking-tight">Classwork Library 🎒</h2>
                 {isTeacher && (
                    <button 
                      className="btn-primary flex items-center gap-3 !py-3 !px-8 shadow-xl shadow-primary/20"
                      onClick={() => setShowTaskForm(true)}
                    >
                       <span className="text-xl leading-none">+</span> Create Module
                    </button>
                 )}
              </div>

              {isTeacher && showTaskForm && (
                <div className="premium-card !p-10 shadow-3xl border-none mb-12 bg-white relative">
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-black text-slate-700">New Module Drafting 🖋️</h3>
                      <button onClick={() => setShowTaskForm(false)} className="text-slate-400 hover:text-red-500 font-bold transition-colors">✕ Cancel</button>
                   </div>
                   
                   <div className="flex p-1.5 bg-slate-50 border border-slate-100 rounded-2xl mb-8 max-w-sm">
                      <button className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${taskType === 'lesson' ? 'bg-white text-primary shadow-md' : 'text-slate-400'}`} onClick={() => setTaskType('lesson')}>📖 Lesson</button>
                      <button className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${taskType === 'quiz' ? 'bg-white text-primary shadow-md' : 'text-slate-400'}`} onClick={() => setTaskType('quiz')}>📝 Quiz</button>
                   </div>

                   <div className="space-y-6">
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Module Title</label>
                         <input type="text" placeholder="Lesson or Exam name..." className="input-field !py-4" value={taskData.title} onChange={(e) => setTaskData({...taskData, title: e.target.value})} />
                      </div>

                      {taskType === "lesson" && (
                        <div className="space-y-6 animate-fade-in">
                           <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Visual Media (URL)</label>
                              <input type="text" placeholder="Paste image or youtube link..." className="input-field !py-4" value={taskData.mediaUrl} onChange={(e) => setTaskData({...taskData, mediaUrl: e.target.value})} />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Text Content</label>
                              <textarea className="input-field !rounded-3xl !py-6 min-h-[300px] resize-none" placeholder="Masterfully explain the topic..." value={taskData.content} onChange={(e) => setTaskData({...taskData, content: e.target.value})} />
                           </div>
                        </div>
                      )}

                      {taskType === "quiz" && (
                         <div className="space-y-6 animate-fade-in">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 block mb-2">Examination Questions</label>
                            {taskData.questions.map((q, idx) => (
                              <div key={idx} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4 shadow-inner">
                                <input type="text" placeholder={`Question ${idx + 1}`} className="input-field !bg-white !shadow-none !border-slate-200" value={q.q} onChange={(e) => { const qs = [...taskData.questions]; qs[idx].q = e.target.value; setTaskData({...taskData, questions: qs}); }} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {q.options.map((opt, oIdx) => (
                                    <input key={oIdx} type="text" placeholder={`Option ${oIdx + 1}`} className="w-full text-xs font-bold p-3 bg-white border border-slate-200 rounded-xl outline-none" value={opt} onChange={(e) => { const qs = [...taskData.questions]; qs[idx].options[oIdx] = e.target.value; setTaskData({...taskData, questions: qs}); }} />
                                  ))}
                                </div>
                                <div className="flex items-center gap-3">
                                   <input type="text" placeholder="Correct Answer" className="w-full text-xs font-black px-4 py-3 bg-white border-2 border-green-100 rounded-xl placeholder:text-green-200 text-green-600 outline-none" value={q.a} onChange={(e) => { const qs = [...taskData.questions]; qs[idx].a = e.target.value; setTaskData({...taskData, questions: qs}); }} />
                                </div>
                              </div>
                            ))}
                            <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:border-primary hover:text-primary transition-all" onClick={() => setTaskData({...taskData, questions: [...taskData.questions, { q: "", options: ["", "", "", ""], a: "" }]})}>+ Add Question</button>
                         </div>
                      )}

                      <button className="btn-primary !py-5 mt-4 w-full shadow-2xl flex items-center justify-center gap-3" onClick={handleCreateTask}>Post Module to Class 🚀</button>
                   </div>
                </div>
              )}

              <div className="space-y-12">
                 <div className="border-b-2 border-primary w-24 mb-6"></div>
                 <div className="space-y-4">
                    {subject.lessons?.map(l => {
                      const complete = progress[subject.grade]?.[subject.title]?.includes(l.id.toString());
                      return (
                        <div key={l.id} className="premium-card !p-0 bg-white border-slate-100 overflow-hidden hover:shadow-xl transition-all cursor-pointer group" onClick={() => router.push(`/lessons/${subject.grade}/${subject.title}/${l.id}`)}>
                           <div className="flex items-center border-b border-slate-50 p-6 md:p-8">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mr-6 md:mr-8 shrink-0 ${complete ? 'bg-green-100 text-green-600' : (l.type === 'quiz' ? 'bg-primary text-white' : 'bg-slate-800 text-white')}`}>
                                 {complete ? '✅' : (l.type === 'quiz' ? '📝' : '📖')}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <h4 className="text-lg font-black text-slate-800 group-hover:text-primary transition-colors truncate">{l.title}</h4>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{l.type === 'lesson' ? 'Lecture Material' : 'Knowledge Check'}</p>
                              </div>
                              <span className="text-slate-300 ml-4 group-hover:text-primary transition-colors">❯</span>
                           </div>
                        </div>
                      );
                    })}
                 </div>
              </div>
           </div>
        )}

        {activeTab === "people" && (
          <div className="animate-fade-in max-w-3xl mx-auto space-y-16 pb-24">
             {/* Teachers */}
             <div>
                <div className="flex items-center justify-between mb-8 border-b-2 border-primary-light/30 pb-4">
                   <h3 className="text-2xl font-black text-slate-800 tracking-tight">Teachers</h3>
                   <span className="text-xs font-black text-primary lowercase tracking-wider">1 staff</span>
                </div>
                <div className="flex items-center gap-5 p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
                   <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg">
                      T
                   </div>
                   <div>
                      <h4 className="font-extrabold text-slate-800">Faculty Member</h4>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Main Educator</p>
                   </div>
                </div>
             </div>

             {/* Students */}
             <div>
                <div className="flex items-center justify-between mb-8 border-b-2 border-primary-light/30 pb-4">
                   <h3 className="text-2xl font-black text-slate-800 tracking-tight">Classmates</h3>
                   <span className="text-xs font-black text-primary lowercase tracking-wider">{students.length} kittens</span>
                </div>
                <div className="space-y-4">
                   {students.map(s => (
                     <div key={s.id} className="flex items-center justify-between p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-5">
                           <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center font-black group-hover:bg-primary-light group-hover:text-white transition-all">
                              {(s.name || "K")[0].toUpperCase()}
                           </div>
                           <h4 className="font-extrabold text-slate-700">{s.name}</h4>
                        </div>
                        {isTeacher && <button onClick={() => handleRemoveStudent(s.id)} className="text-red-400 hover:text-red-600 transition-colors px-2 opacity-0 group-hover:opacity-100">Remove</button>}
                     </div>
                   ))}
                   {students.length === 0 && (
                      <div className="py-20 text-center opacity-30 italic font-black uppercase tracking-widest">
                         Room occupancy: zero kittens.
                      </div>
                   )}
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
