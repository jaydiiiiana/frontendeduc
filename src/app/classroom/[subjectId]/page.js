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
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm animate-fade-in">
        <div className="container mx-auto max-w-6xl px-6 flex items-center gap-10">
           {["stream", "lessons", ...(isTeacher ? ["students"] : [])].map(tab => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
             >
               {tab}
               {activeTab === tab && (
                 <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(255,107,158,0.3)]"></div>
               )}
             </button>
           ))}
        </div>
      </div>

      {/* Content Area */}
      <main className="container mx-auto max-w-6xl px-6 py-12 animate-slide-up">

        {activeTab === "stream" && (
          <div className="space-y-8">
            {isTeacher && (
              <div className="mb-12">
                {!showTaskForm ? (
                   <button 
                     onClick={() => setShowTaskForm(true)}
                     className="w-full premium-card !p-8 flex items-center gap-6 group hover:shadow-2xl hover:-translate-y-1 transition-all border-none bg-white text-left"
                   >
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:bg-primary group-hover:text-white transition-colors">✏️</div>
                      <div className="flex-1">
                        <p className="text-lg font-black text-slate-700 tracking-tight">Create a New Module</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Broadcast a lesson or examination to your class</p>
                      </div>
                      <span className="text-slate-300 opacity-40 group-hover:opacity-100 group-hover:translate-x-2 transition-all">❯</span>
                   </button>
                ) : (
                  <div className="premium-card !p-10 shadow-3xl border-none relative overflow-hidden bg-white">
                    <div className="relative z-10">
                       <div className="flex items-center justify-between mb-10">
                          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Workshop Center 🛠️</h3>
                          <button onClick={() => setShowTaskForm(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-colors">✕</button>
                       </div>

                       <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-8 max-w-md">
                          <button className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${taskType === 'lesson' ? 'bg-white text-primary shadow-md' : 'text-slate-400'}`} onClick={() => setTaskType('lesson')}>📖 Lesson</button>
                          <button className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${taskType === 'quiz' ? 'bg-white text-primary shadow-md' : 'text-slate-400'}`} onClick={() => setTaskType('quiz')}>📝 Exam</button>
                       </div>

                       <div className="space-y-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Title Identity</label>
                             <input type="text" placeholder="e.g. Chapter 1: Introduction to Kittronomy" className="input-field !py-4" value={taskData.title} onChange={(e) => setTaskData({...taskData, title: e.target.value})} />
                          </div>

                          {taskType === "lesson" && (
                            <div className="space-y-6">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Media Reference</label>
                                  <input type="text" placeholder="Paste direct Image URL or YouTube Link..." className="input-field !py-4" value={taskData.mediaUrl} onChange={(e) => setTaskData({...taskData, mediaUrl: e.target.value})} />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Curriculum Content</label>
                                  <textarea className="input-field !rounded-3xl !py-6 min-h-[250px] resize-none" placeholder="Unleash your wisdom here..." value={taskData.content} onChange={(e) => setTaskData({...taskData, content: e.target.value})} />
                               </div>
                            </div>
                          )}

                          {taskType === "quiz" && (
                            <div className="space-y-4">
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 block mb-2">Examination Questions</label>
                               {taskData.questions.map((q, idx) => (
                                 <div key={idx} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4 shadow-inner">
                                   <input type="text" placeholder={`Question ${idx + 1}`} className="input-field !bg-white !shadow-none !border-slate-200" value={q.q} onChange={(e) => { const qs = [...taskData.questions]; qs[idx].q = e.target.value; setTaskData({...taskData, questions: qs}); }} />
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                     {q.options.map((opt, oIdx) => (
                                       <input key={oIdx} type="text" placeholder={`Option ${oIdx + 1}`} className="w-full text-xs font-bold p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 ring-primary-light/50" value={opt} onChange={(e) => { const qs = [...taskData.questions]; qs[idx].options[oIdx] = e.target.value; setTaskData({...taskData, questions: qs}); }} />
                                     ))}
                                   </div>
                                   <div className="flex items-center gap-3">
                                      <div className="flex-1 relative">
                                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none">✅</span>
                                         <input type="text" placeholder="Correct Answer" className="w-full text-xs font-black pl-10 pr-4 py-3 bg-white border-2 border-green-100 rounded-xl outline-none focus:ring-2 ring-green-100 text-green-600" value={q.a} onChange={(e) => { const qs = [...taskData.questions]; qs[idx].a = e.target.value; setTaskData({...taskData, questions: qs}); }} />
                                      </div>
                                   </div>
                                 </div>
                               ))}
                               <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:border-primary hover:text-primary transition-all" onClick={() => setTaskData({...taskData, questions: [...taskData.questions, { q: "", options: ["", "", "", ""], a: "" }]})}>+ Add Question</button>
                            </div>
                          )}

                          <button className="btn-primary !py-5 mt-4 w-full shadow-2xl shadow-primary/20 flex items-center justify-center gap-3" onClick={handleCreateTask}>Post to Class 🚀</button>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:gap-6">
              {(!subject.lessons || subject.lessons.length === 0) ? (
                <div className="premium-card !p-20 text-center opacity-30 italic font-black uppercase tracking-widest">
                  <div className="text-6xl mb-6">📭</div>
                  The stream is currently silent.
                </div>
              ) : (
                subject.lessons.map((lesson) => {
                  const isCompleted = progress[subject.grade]?.[subject.title]?.includes(lesson.id.toString());
                  return (
                    <div 
                      key={lesson.id} 
                      className={`premium-card group !p-6 md:!p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer border-none shadow-xl bg-white ${isCompleted ? 'ring-2 ring-green-500/20' : ''}`}
                      onClick={() => router.push(`/lessons/${subject.grade}/${subject.title}/${lesson.id}`)}
                    >
                       <div className="flex items-center gap-6 md:gap-8">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner transition-transform group-hover:scale-110 duration-500 ${isCompleted ? 'bg-green-50 text-green-500' : (lesson.type === 'quiz' ? 'bg-primary-light text-primary' : 'bg-slate-50 text-slate-600')}`}>
                             {isCompleted ? '✅' : (lesson.type === 'quiz' ? '📝' : '📖')}
                          </div>
                          <div>
                            <h3 className="text-lg md:text-xl font-black text-slate-800 mb-1 leading-tight group-hover:text-primary transition-colors">{lesson.title}</h3>
                            <div className="flex items-center gap-3">
                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{lesson.type === 'quiz' ? 'Knowledge Check' : 'Reading Module'}</span>
                               {isCompleted && <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Completed Accountable</span>}
                            </div>
                          </div>
                       </div>
                       <button className={`btn-primary !py-3 !px-8 !text-xs !shadow-none group-hover:!shadow-lg group-hover:!shadow-primary/20 transition-all ${isCompleted ? '!bg-green-500' : (lesson.type === 'lecture' ? '!bg-slate-800' : '')}`}>
                         {isCompleted ? "Review" : (lesson.type === "quiz" ? "Start" : "Study")} 🐾
                       </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === "lessons" && (
           /* Same list as stream for lessons specific view */
           <div className="grid grid-cols-1 gap-4">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-8">Curriculum Module Index</h2>
              {subject.lessons?.map(l => (
                <div key={l.id} className="premium-card !p-6 flex items-center justify-between border-none shadow-md bg-white hover:shadow-xl transition-all cursor-pointer" onClick={() => router.push(`/lessons/${subject.grade}/${subject.title}/${l.id}`)}>
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg">{l.type === 'quiz' ? '📝' : '📖'}</div>
                      <span className="font-bold text-slate-700">{l.title}</span>
                   </div>
                   <span className="text-xs font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100">Enter Module</span>
                </div>
              ))}
           </div>
        )}

        {activeTab === "students" && isTeacher && (
          <div className="space-y-12">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {students.map(s => (
                  <div key={s.id} className="premium-card !p-8 flex items-center justify-between bg-white border-none shadow-xl hover:shadow-2xl transition-all group">
                     <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-gradient-to-tr from-primary-light to-white rounded-3xl flex items-center justify-center text-xl font-black text-primary shadow-inner">
                           {(s.name || "K")[0].toUpperCase()}
                        </div>
                        <div>
                           <h4 className="text-lg font-black text-slate-800 mb-1">{s.name}</h4>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Level {s.level || 1} Scholar</p>
                        </div>
                     </div>
                     <button onClick={() => handleRemoveStudent(s.id)} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-400 rounded-xl border border-red-100 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">🗑️</button>
                  </div>
                ))}
                {students.length === 0 && (
                   <div className="col-span-full py-20 border-2 border-dashed border-slate-100 rounded-[2rem] text-center opacity-30 italic font-black uppercase tracking-widest">
                      The roster is currently void.
                   </div>
                )}
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
