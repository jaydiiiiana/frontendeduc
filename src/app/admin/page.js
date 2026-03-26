"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [customCurriculum, setCustomCurriculum] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null); // for subject detail view
  const [subjectStudents, setSubjectStudents] = useState([]);
  const [roleUpdating, setRoleUpdating] = useState(null); // track which user is updating
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [expiryDate, setExpiryDate] = useState(null);
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
  
  // Create Content State
  const [contentType, setContentType] = useState("subject"); 
  const [newContent, setNewContent] = useState({
    grade: "Kinder 1",
    subjectTitle: "",
    subjectIcon: "📚",
    title: "",
    content: "",
    mediaUrl: "",
    questions: [{ q: "", options: ["", "", "", ""], a: "" }],
    isPublic: false
  });
  const [newAnnouncement, setNewAnnouncement] = useState({ content: "", targetGrade: "" });
  const [announcements, setAnnouncements] = useState([]);
  const [invites, setInvites] = useState([]);

  const [sectionConfig, setSectionConfig] = useState({ 
    "1": ["Mercury", "Venus", "Earth", "Mars", "Jupiter"], 
    "2": ["Section 1", "Section 2", "Section 3"],
    "3": ["Section 1", "Section 2", "Section 3"],
    "4": ["Section 1", "Section 2", "Section 3"],
    "5": ["Section 1", "Section 2", "Section 3"],
    "6": ["Section 1", "Section 2", "Section 3"] 
  });
  
  const gradeOptions = [
    "Kinder 1", "Kinder 2",
    ...[1,2,3,4,5,6].flatMap(n => {
       const sections = sectionConfig[n.toString()] || [];
       return [
         `Grade ${n}`,
         ...sections.map(s => `Grade ${n} - ${s}`)
       ];
    })
  ];

  useEffect(() => {
    const fetchAllData = async () => {
       try {
         const storedUser = JSON.parse(localStorage.getItem("catUser"));
         if (!storedUser) { // If no user in local storage, redirect to home
           router.push("/");
           return;
         }

         // 1. REFRESH CURRENT USER FROM DATABASE (Real-time role/subscription check)
         const uOneRes = await fetch(`/api/users/${storedUser.id}`);
         const userLatest = await uOneRes.json();
         const activeUser = { ...storedUser, ...userLatest };
         localStorage.setItem("catUser", JSON.stringify(activeUser));
         setCurrentUser(activeUser);

         if (activeUser.role === 'Student') {
           router.push("/dashboard");
           return;
         }
         
         if (activeUser.role === 'Creator') {
           router.push("/creator");
           return;
         }

          // 2. Headmaster Expiry Check
          if (activeUser.role === 'Headmaster' && activeUser.subscription_expires_at) {
             const now = new Date();
             const exp = new Date(activeUser.subscription_expires_at);
             if (now > exp) {
               setIsExpired(true);
               setExpiryDate(exp.toLocaleDateString());
               setLoading(false);
               return;
             }
          }

         if (activeUser.role === 'Teacher') setActiveTab("subjects");

          const [uRes, cRes, aRes, vRes] = await Promise.all([
            fetch("/api/users"),
            fetch(`/api/curriculum?userId=${storedUser.id}&role=${storedUser.role}`),
            fetch("/api/announcements"),
            fetch(`/api/invites?userId=${storedUser.id}`)
          ]);
         const userData = await uRes.json();
         const currData = await cRes.json();
         const annData = await aRes.json();
         const invData = await vRes.json();
         
         if (!userData.error) setUsers(Array.isArray(userData) ? userData : []);
                  
          // 2. Cascade School Freeze Check
          if (storedUser.role !== 'Creator') {
            const allUData = userData;
            if (Array.isArray(allUData)) {
              let myHeadmaster = null;
              if (storedUser.role === 'Headmaster') myHeadmaster = storedUser;
              else {
                // Use loose equality for IDs which might be strings or numbers
                const myInviter = allUData.find(u => String(u.id) === String(storedUser.invited_by));
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

          if (!currData.error) setCustomCurriculum(currData);
          if (Array.isArray(annData)) setAnnouncements(annData);
          if (Array.isArray(invData)) setInvites(invData);
       } catch (e) { 
         console.error("Fetch failed", e); 
       } finally { 
         setLoading(false); 
       }
    };
    fetchAllData();
    
    // Auto-Sync every 15 seconds (keeps freeze status/users updated)
    const syncInterval = setInterval(fetchAllData, 15000);
    return () => clearInterval(syncInterval);
  }, [router]);

  // Change user role
  const handleRoleChange = async (userId, newRole) => {
    setRoleUpdating(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, { 
        method: "PATCH", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole, requesterId: currentUser.id }) 
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        alert(`Role updated to ${newRole}! ✅`);
      } else {
        alert("Failed to update role: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      alert("Network error: " + e.message);
    } finally {
      setRoleUpdating(null);
    }
  };

  // Open subject detail
  const handleOpenSubject = async (subj, grade) => {
    setSelectedSubject({ ...subj, grade });
    setActiveTab("subjectDetail");
    // Fetch students for this subject
    try {
      const res = await fetch(`/api/classroom/${subj.id}?userId=${currentUser.id}`);
      const data = await res.json();
      setSubjectStudents(data.students || []);
    } catch (e) { setSubjectStudents([]); }
  };

  // Delete a lesson/task
  const handleDeleteLesson = async (lessonId) => {
    if (!confirm("Delete this lesson/exam? This cannot be undone!")) return;
    try {
      const res = await fetch(`/api/lessons/${lessonId}?requesterId=${currentUser.id}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedSubject({
          ...selectedSubject,
          lessons: selectedSubject.lessons.filter(l => l.id !== lessonId)
        });
        alert("Deleted! 🗑️");
      }
    } catch (e) { alert("Error: " + e.message); }
  };

  // Delete a subject
  const handleDeleteSubject = async (subjectId) => {
    if (!confirm("⚠️ Delete this entire subject and all its lessons? This cannot be undone!")) return;
    try {
      const res = await fetch(`/api/subjects/${subjectId}?requesterId=${currentUser.id}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedSubject(null);
        setActiveTab("subjects");
        // Remove from local state
        const updated = { ...customCurriculum };
        Object.keys(updated).forEach(g => {
          if (Array.isArray(updated[g])) {
            updated[g] = updated[g].filter(s => s.id !== subjectId);
            if (updated[g].length === 0) delete updated[g];
          }
        });
        setCustomCurriculum(updated);
        alert("Subject deleted! 🗑️");
      }
    } catch (e) { alert("Error: " + e.message); }
  };

  // Remove student from subject
  const handleRemoveStudent = async (studentId) => {
    if (!confirm("Remove this student from the class?")) return;
    try {
      const res = await fetch(`/api/classroom/${selectedSubject.id}/students/${studentId}?requesterId=${currentUser.id}`, { method: "DELETE" });
      if (res.ok) {
        setSubjectStudents(subjectStudents.filter(s => s.id !== studentId));
        alert("Student removed! ✅");
      }
    } catch (e) { alert("Error: " + e.message); }
  };

  // Toggle Visibility
  const handleToggleVisibility = async (newVal) => {
    try {
      const res = await fetch(`/api/subjects/${selectedSubject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: newVal, userId: currentUser.id })
      });
      if (res.ok) {
        setSelectedSubject({ ...selectedSubject, is_public: newVal });
        // update local list
        const updated = { ...customCurriculum };
        Object.keys(updated).forEach(g => {
           if (Array.isArray(updated[g])) {
              updated[g] = updated[g].map(s => s.id === selectedSubject.id ? { ...s, is_public: newVal } : s);
           }
        });
        setCustomCurriculum(updated);
        alert(`Visibility updated to ${newVal ? 'Public' : 'Private'}! 🐾`);
      }
    } catch (e) { alert("Failed to update visibility: " + e.message); }
  };

  // Post Announcement
  const handlePostAnnouncement = async () => {
    if (!newAnnouncement.content) return;
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newAnnouncement, authorId: currentUser.id })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnnouncements([data, ...announcements]);
      setNewAnnouncement({ content: "", targetGrade: "" });
      alert("Announcement posted! 📜✅");
    } catch (e) { alert("Failed: " + e.message); }
  };

  const handleGenerateInvite = async (role) => {
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           userId: currentUser.id, 
           roleToGrant: role,
           durationMonths: 1200 
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInvites([data, ...invites]);
      alert(`${role} code generated! 🎫✨`);
    } catch (e) { alert("Failed: " + e.message); }
  };

  // Change student grade/section
  const handleGradeChange = async (userId, newGrade) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: newGrade, requesterId: currentUser.id })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, grade: newGrade } : u));
        alert("Student moved to new Grade/Section! 🏫✅");
      }
    } catch (e) { alert("Failed! " + e.message); }
  };

  // Save new content
  const handleSaveContent = async () => {
    try {
      if (contentType === "subject" && !newContent.subjectTitle) {
        alert("Please enter a Subject Title! 🐾"); return;
      }
      if (contentType !== "subject" && !newContent.title) {
        alert("Please enter a Title! 🐾"); return;
      }

      const payload = contentType === "subject" ? {
        type: "subject",
        grade: newContent.grade,
        title: newContent.subjectTitle,
        icon: newContent.subjectIcon || "📚",
        userId: currentUser.id,
        isPublic: newContent.isPublic
      } : {
        grade: newContent.grade,
        subjectTitle: newContent.subjectTitle,
        title: newContent.title,
        content: contentType === "lecture" ? newContent.content : null,
        mediaUrl: contentType === "lecture" ? newContent.mediaUrl : null,
        questions: contentType === "quiz" ? newContent.questions : null,
        userId: currentUser.id
      };

      const response = await fetch("/api/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      alert(`Created successfully! 🐾 ${data.code ? `\nInvite Code: ${data.code}` : ""}`);
      window.location.reload();
    } catch (e) { alert("Failed! " + e.message); }
  };

  if (loading) return <div className="flex-center" style={{ height: "100vh" }}>Accessing Cat Academy Academy... 🐾</div>;

  if (isExpired) {
    return (
      <div className="flex-center" style={{ height: "100vh", background: "#fff5f5", padding: "2rem", textAlign: "center" }}>
        <div className="premium-card cat-ears" style={{ maxWidth: "500px", border: "2px solid #ef4444" }}>
           <div style={{ fontSize: "5rem", marginBottom: "1rem" }}>🔒🏫</div>
           <h2 style={{ color: "#ef4444", marginBottom: "1rem" }}>School Access Frozen</h2>
           <p style={{ color: "#666", lineHeight: "1.6", marginBottom: "2rem" }}>
              Your Headmaster subscription expired on **{expiryDate}**. 🐾 <br />
              All school operations, including for your teachers and students, have been temporarily paused.
           </p>
           <p style={{ fontWeight: "800", marginBottom: "2rem" }}>Please contact the system Creator to renew your subscription. 🎫</p>
           <button className="btn-secondary" onClick={() => router.push("/")}>Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden font-sans pb-24">
      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-primary-light/40 mix-blend-multiply filter blur-[100px] blob-shape opacity-60"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] bg-indigo-100 mix-blend-multiply filter blur-[80px] blob-shape animation-delay-2000 opacity-50"></div>
      </div>

      <div className="container mx-auto px-6 pt-10 relative z-10">
        {/* Header */}
        <header className="glass-panel p-4 md:p-6 mb-10 shadow-xl border-white/40">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg ring-4 ring-white shrink-0">
                    {currentUser?.role === 'Headmaster' ? "👑" : "👩‍🏫"}
                 </div>
                 <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                       {currentUser?.role} Dashboard 
                       <button 
                         title="Sync Data" 
                         className="text-sm opacity-30 hover:opacity-100 transition-opacity"
                         onClick={() => window.location.reload()}
                       >
                         🔄
                       </button>
                    </h1>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[2px]">Academy Management System</p>
                 </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest sm:hidden">Quick Actions</span>
                  {currentUser?.role === 'Headmaster' && (
                    <button 
                      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${activeTab === "setup" ? "bg-primary text-white" : "bg-white text-slate-400 hover:text-primary shadow-sm border border-slate-100"}`}
                      onClick={() => setActiveTab("setup")}
                      title="Section Setup"
                    >
                       ⚙️
                    </button>
                  )}
                  <button 
                    className="w-10 h-10 flex items-center justify-center bg-white text-slate-400 hover:text-primary shadow-sm border border-slate-100 rounded-xl transition-all"
                    onClick={() => router.push("/dashboard")}
                    title="Return Home"
                  >
                     🏠
                  </button>
                  <button 
                    className="w-10 h-10 flex items-center justify-center bg-white text-red-400 hover:bg-red-50 shadow-sm border border-red-50 rounded-xl transition-all"
                    onClick={() => { localStorage.removeItem("catUser"); router.push("/"); }}
                    title="Logout"
                  >
                     🚪
                  </button>
                </div>
              </div>
           </div>

           <nav className="mt-6">
              <div className="flex p-1 bg-slate-100/50 rounded-2xl backdrop-blur-sm border border-slate-200/50 overflow-x-auto no-scrollbar w-full">
                <div className="flex items-center gap-1 min-w-max">
                  {currentUser?.role === 'Headmaster' && (
                    <>
                      <button 
                          className={`px-5 py-2 rounded-xl font-bold text-xs md:text-sm transition-all ${activeTab === "users" ? "bg-white text-primary shadow-md active:scale-95" : "text-slate-500 hover:text-slate-700"}`}
                          onClick={() => { setSelectedSubject(null); setActiveTab("users"); }}
                      >
                          Users
                      </button>
                      <button 
                          className={`px-5 py-2 rounded-xl font-bold text-xs md:text-sm transition-all ${activeTab === "bulletin" ? "bg-white text-primary shadow-md active:scale-95" : "text-slate-500 hover:text-slate-700"}`}
                          onClick={() => { setSelectedSubject(null); setActiveTab("bulletin"); }}
                      >
                          Bulletin
                      </button>
                    </>
                  )}
                  <button 
                      className={`px-5 py-2 rounded-xl font-bold text-xs md:text-sm transition-all ${activeTab === "invites" ? "bg-white text-primary shadow-md active:scale-95" : "text-slate-500 hover:text-slate-700"}`}
                      onClick={() => { setSelectedSubject(null); setActiveTab("invites"); }}
                  >
                      Invites
                  </button>
                  <button 
                      className={`px-5 py-2 rounded-xl font-bold text-xs md:text-sm transition-all ${activeTab === "subjects" || activeTab === "subjectDetail" ? "bg-white text-primary shadow-md active:scale-95" : "text-slate-500 hover:text-slate-700"}`}
                      onClick={() => { setSelectedSubject(null); setActiveTab("subjects"); }}
                  >
                      Subjects
                  </button>
                  <button 
                      className={`px-5 py-2 rounded-xl font-bold text-xs md:text-sm transition-all ${activeTab === "add" ? "bg-white text-primary shadow-md active:scale-95" : "text-slate-500 hover:text-slate-700"}`}
                      onClick={() => setActiveTab("add")}
                  >
                      + Create
                  </button>
                </div>
              </div>
           </nav>
        </header>

        {/* ========== USERS TAB ========== */}
        {activeTab === "users" && (() => {
          const filteredUsers = users.filter(u => {
            const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesSearch) return false;
            if (currentUser.role === 'Creator') return true;
            if (currentUser.role === 'Headmaster') {
              // Get all teacher IDs invited by this headmaster as strings
              const teacherIds = users
                .filter(usr => usr.role === 'Teacher' && String(usr.invited_by) === String(currentUser.id))
                .map(t => String(t.id));
              
              const isDirectInvite = String(u.invited_by) === String(currentUser.id);
              const isTeacherInvite = teacherIds.includes(String(u.invited_by));
              const isSelf = String(u.id) === String(currentUser.id);
              
              return isDirectInvite || isTeacherInvite || isSelf;
            }
            if (currentUser.role === 'Teacher') {
              return String(u.invited_by) === String(currentUser.id) || String(u.id) === String(currentUser.id);
            }
            return false;
          });
          
          const grouped = filteredUsers.reduce((acc, u) => {
            if (u.role === 'Headmaster') { acc['1_Headmaster'] = [...(acc['1_Headmaster'] || []), u]; }
            else if (u.role === 'Teacher') { acc['2_Teachers'] = [...(acc['2_Teachers'] || []), u]; }
            else {
               const g = u.grade || 'Unassigned Students';
               acc[`3_${g}`] = [...(acc[`3_${g}`] || []), u];
            }
            return acc;
          }, {});
          
          const sortedKeys = Object.keys(grouped).sort();

          return (
            <div className="animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 text-center md:text-left">
                 <div className="px-2">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Academy Roster <span className="text-primary text-xl md:text-2xl font-bold ml-1 md:ml-2">({filteredUsers.length})</span></h2>
                    <p className="text-sm md:text-base text-slate-500 font-medium">Manage your students and faculty members.</p>
                 </div>
                 <div className="relative group w-full md:min-w-[300px]">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">🔍</span>
                    <input 
                      type="text" 
                      placeholder="Search anyone..." 
                      className="input-field !pl-12 !py-4 shadow-sm focus:shadow-md transition-all !rounded-2xl w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>
              </div>

              <div className="space-y-12">
                {sortedKeys.map(catKey => {
                  const isAdmin = catKey.startsWith('1_');
                  const isTeacher = catKey.startsWith('2_');
                  const title = isAdmin ? 'Administration' : isTeacher ? 'Teaching Faculty' : catKey.substring(2);
                  const icon = isAdmin ? '👑' : isTeacher ? '📖' : '🎒';
                  const catUsers = grouped[catKey];
                  
                  return (
                    <div key={catKey} className="group/section">
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm ${isAdmin ? 'bg-amber-100 text-amber-600' : isTeacher ? 'bg-indigo-100 text-indigo-600' : 'bg-primary-light/30 text-primary'}`}>
                           {icon}
                        </div>
                        <h3 className="text-xl font-black text-slate-700 tracking-tight capitalize">{title}</h3>
                        <div className="flex-1 h-px bg-slate-200 group-hover/section:bg-primary-light/50 transition-colors"></div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{catUsers.length} MEMBERS</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {catUsers.map((u) => (
                          <div key={u.id} className="premium-card !p-5 group/user hover:-translate-y-1 transition-all border-slate-100 hover:border-primary-light hover:shadow-xl relative overflow-hidden">
                            <div className="flex items-center gap-4 relative z-10">
                              <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center font-black text-xl shadow-inner transition-colors ${u.role === "Headmaster" ? "bg-amber-50 text-amber-600" : u.role === "Teacher" ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-400 group-hover/user:bg-primary-light/10 group-hover/user:text-primary"}`}>
                                {(u.name || "?")[0].toUpperCase()}
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <h4 className="font-black text-slate-800 truncate leading-tight mb-1">{u.name}</h4>
                                {u.role === 'Student' ? (
                                  currentUser?.role === 'Headmaster' ? (
                                     <select 
                                       className="text-[10px] font-black uppercase text-slate-400 tracking-wider bg-slate-100/50 hover:bg-white hover:text-primary cursor-pointer transition-all rounded-md px-1 py-0.5 border-none outline-none"
                                       value={u.grade}
                                       onChange={(e) => handleGradeChange(u.id, e.target.value)}
                                     >
                                        {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
                                     </select>
                                  ) : (
                                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{u.grade}</p>
                                  )
                                ) : (
                                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{u.role}</p>
                                )}
                              </div>
                            </div>

                            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 relative z-10">
                              <div className="flex-1">
                                {u.id === currentUser?.id ? (
                                  <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest italic leading-none">Your Own Profile</span>
                                ) : u.role === 'Headmaster' ? (
                                  <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest italic leading-none">Senior Official</span>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <select 
                                      className="text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 ring-primary-light/50 transition-all flex-1"
                                      value={u.role || "Student"}
                                      disabled={roleUpdating === u.id}
                                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                    >
                                      <option value="Student">🎒 Student</option>
                                      <option value="Teacher">📖 Teacher</option>
                                    </select>
                                    {roleUpdating === u.id && <span className="animate-spin text-primary">⏳</span>}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="absolute -bottom-4 -right-4 text-7xl opacity-[0.02] rotate-12 transition-transform group-hover/user:scale-125 group-hover/user:rotate-0 pointer-events-none">{icon}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
        
        {/* ========== BULLETIN TAB (Headmaster) ========== */}
        {activeTab === "bulletin" && (
          <div className="animate-fade-in max-w-4xl mx-auto">
             <div className="mb-10 text-center">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Announcement Hall 📜</h2>
                <p className="text-slate-500 font-medium">Broadcast news to your students and teachers.</p>
             </div>
             
             <div className="premium-card shadow-2xl overflow-hidden mb-12 border-none">
                <div className="bg-gradient-to-r from-amber-400 to-amber-500 p-6 flex items-center gap-4 text-white">
                   <div className="w-12 h-12 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center text-2xl">✍️</div>
                   <div>
                      <h4 className="font-black tracking-tight leading-none mb-1">New Official Proclamation</h4>
                      <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Publically Visible Message</p>
                   </div>
                </div>
                <div className="p-8 space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 mb-2 block">Your Message</label>
                    <textarea 
                      placeholder="What is the latest mandatory news, Headmaster? 🐾"
                      className="input-field !rounded-3xl !py-6 min-h-[160px] resize-none"
                      value={newAnnouncement.content}
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                    />
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1 w-full relative">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 mb-2 block">Target Audience</label>
                       <select 
                         className="input-field !py-4"
                         value={newAnnouncement.targetGrade}
                         onChange={(e) => setNewAnnouncement({...newAnnouncement, targetGrade: e.target.value})}
                       >
                          <option value="">The Whole Academy 🌍</option>
                          {gradeOptions.map(g => <option key={g} value={g}>{g} Members Only</option>)}
                       </select>
                    </div>
                    <div className="w-full md:w-auto md:self-end">
                       <button className="btn-primary !py-4 px-10 shadow-xl shadow-primary/20 flex items-center gap-3 w-full" onClick={handlePostAnnouncement}>
                          Post Proclamation 🚀
                       </button>
                    </div>
                  </div>
                </div>
             </div>

             <div className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                   <h3 className="text-xl font-black text-slate-700 tracking-tight">Recent Archives</h3>
                   <div className="flex-1 h-px bg-slate-200"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                  {announcements.map((a, i) => (
                    <div key={i} className="glass-card hover:bg-white transition-all group border-slate-200/50">
                       <div className="flex justify-between items-start mb-4">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${a.target_grade ? 'bg-indigo-50 text-indigo-500' : 'bg-amber-50 text-amber-500'}`}>
                             {a.target_grade || "GENERAL"}
                          </span>
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                       </div>
                       <p className="text-slate-700 font-medium leading-relaxed">{a.content}</p>
                    </div>
                  ))}
                  {announcements.length === 0 && <div className="md:col-span-2 py-20 text-center opacity-30 text-xl font-bold italic tracking-wider">The archives are currently empty...</div>}
                </div>
             </div>
          </div>
        )}

        {/* ========== SUBJECTS LIST TAB ========== */}
        {activeTab === "subjects" && (
          <div className="animate-fade-in pb-20">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">Curriculum Library <span className="text-secondary text-2xl ml-2">📚</span></h2>
                  <p className="text-slate-500 font-medium">Manage and organize all academic materials.</p>
                </div>
                <button 
                  className="btn-primary !py-3.5 !px-8 shadow-xl shadow-primary/20 flex items-center gap-3" 
                  onClick={() => setActiveTab("add")}
                >
                   <span className="text-xl leading-none">+</span> New Subject
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Object.entries(customCurriculum).length === 0 ? (
                  <div className="col-span-full py-24 text-center glass-panel border-dashed border-2 border-slate-200">
                     <div className="text-8xl mb-6 grayscale opacity-20">📚</div>
                     <h3 className="text-xl font-black text-slate-400">Library is currently empty</h3>
                     <p className="text-slate-400 font-medium mb-8">Start by creating your first subject or inviting teachers.</p>
                     <button className="btn-primary" onClick={() => setActiveTab("add")}>Create Subject Now 🐾</button>
                  </div>
                ) : (
                  Object.entries(customCurriculum).map(([grade, subjects]) => (
                    Array.isArray(subjects) ? subjects.map(s => (
                      <div 
                        key={s.id} 
                        className={`premium-card group cursor-pointer hover:-translate-y-2 !transition-all duration-300 relative overflow-hidden ${s.is_public ? 'border-2 border-amber-400/30' : 'border-slate-100'}`}
                        onClick={() => handleOpenSubject(s, grade)}
                      >
                        <div className="flex justify-between items-start mb-6">
                           <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-sm transition-transform group-hover:scale-110 duration-500 ${s.is_public ? 'bg-amber-50 text-amber-500' : 'bg-primary-light/10 text-primary'}`}>
                              {s.icon}
                           </div>
                           <div className="flex flex-col items-end gap-1.5">
                              {s.is_public && <span className="bg-amber-400 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">Official</span>}
                              <span className="bg-primary-light/20 text-primary text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">{grade}</span>
                           </div>
                        </div>

                        <h4 className="text-xl font-black text-slate-800 tracking-tight leading-tight mb-2 group-hover:text-primary transition-colors">{s.title}</h4>
                        
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-400 mb-6">
                          <span className="flex items-center gap-1">📖 {s.lessons?.length || 0} Modules</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">👥 {s.studentsCount || 0} Enrolled</span>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between mb-6 group-hover:border-primary-light/50 transition-colors">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Invite Code</span>
                           <span className="text-sm font-black text-indigo-500 bg-white px-3 py-1 rounded-lg shadow-sm border border-slate-100">{s.code}</span>
                        </div>

                        <button className="w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest bg-white border border-slate-100 text-slate-400 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                          Manage Subject →
                        </button>
                        
                        <div className="absolute -bottom-6 -right-6 text-[8rem] opacity-[0.03] rotate-[-15deg] group-hover:rotate-0 transition-transform duration-700 pointer-events-none">{s.icon}</div>
                      </div>
                    )) : null
                  ))
                )}
             </div>
          </div>
        )}

        {/* ========== SUBJECT DETAIL TAB ========== */}
        {activeTab === "subjectDetail" && selectedSubject && (
          <div className="animate-fade-in pb-20">
            {/* Navigation Header */}
            <div className="flex items-center justify-between gap-6 mb-8">
               <button 
                className="flex items-center gap-3 text-sm font-black text-slate-400 hover:text-primary transition-colors group"
                onClick={() => { setSelectedSubject(null); setActiveTab("subjects"); }}
               >
                  <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:bg-primary-light/10 transition-colors">←</span>
                  Back to Library
               </button>
               <div className="h-px flex-1 bg-slate-200"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
               {/* Sidebar Info */}
               <div className="lg:col-span-4 space-y-6">
                  <div className={`premium-card !p-8 relative overflow-hidden text-center border-none shadow-2xl ${selectedSubject.is_public ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' : 'bg-gradient-to-br from-primary to-accent text-white'}`}>
                     <div className="relative z-10">
                        <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center text-6xl mx-auto mb-6 shadow-xl ring-4 ring-white/10">
                           {selectedSubject.icon}
                        </div>
                        <h2 className="text-3xl font-black tracking-tight mb-2">{selectedSubject.title}</h2>
                        <div className="flex items-center justify-center gap-2 mb-8 opacity-90">
                           <span className="text-sm font-bold uppercase tracking-widest">{selectedSubject.grade}</span>
                           <span>•</span>
                           <span className="text-sm font-bold">Code: <span className="font-black bg-white/20 px-2 py-0.5 rounded-md">{selectedSubject.code}</span></span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                           <button 
                              className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest backdrop-blur-md transition-all active:scale-95 ${selectedSubject.is_public ? 'bg-white text-amber-600 hover:bg-amber-50' : 'bg-white text-primary hover:bg-slate-50'}`}
                              onClick={() => handleToggleVisibility(!selectedSubject.is_public)}
                           >
                              {selectedSubject.is_public ? "Go Private 🔒" : "Go Public 🌍"}
                           </button>
                           <button 
                              className="py-3 bg-red-500/20 hover:bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border border-white/20"
                              onClick={() => handleDeleteSubject(selectedSubject.id)}
                           >
                              Delete 🗑️
                           </button>
                        </div>
                     </div>
                     <div className="absolute -bottom-10 -right-10 text-[15rem] opacity-10 rotate-12 pointer-events-none">{selectedSubject.icon}</div>
                  </div>

                  {/* Enroll Info */}
                  <div className="premium-card !p-6 border-slate-100 flex items-center justify-between">
                     <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Enrolled</p>
                        <h4 className="text-2xl font-black text-slate-700">{subjectStudents.length} Students</h4>
                     </div>
                     <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                        👥
                     </div>
                  </div>
               </div>

               {/* Lessons & Students List */}
               <div className="lg:col-span-8 space-y-10">
                  {/* Lessons Listing */}
                  <div className="premium-card !p-8">
                    <div className="flex items-center justify-between mb-8">
                       <div>
                          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Academic Modules</h3>
                          <p className="text-sm font-medium text-slate-500">Lectures and examinations for this class.</p>
                       </div>
                       <button className="btn-primary !py-3 !px-6 !text-xs !rounded-xl" onClick={() => {
                          setNewContent({ ...newContent, grade: selectedSubject.grade, subjectTitle: selectedSubject.title, subjectIcon: selectedSubject.icon });
                          setContentType("lecture");
                          setActiveTab("add");
                       }}>
                          + Add Modules
                       </button>
                    </div>

                    <div className="space-y-4">
                      {(!selectedSubject.lessons || selectedSubject.lessons.length === 0) ? (
                        <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                           <p className="text-4xl mb-4 grayscale filter">🗂️</p>
                           <p className="text-slate-400 font-bold italic tracking-wider">No modules uploaded yet.</p>
                        </div>
                      ) : (
                        selectedSubject.lessons.map((l) => (
                          <div key={l.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group/lesson hover:bg-white hover:shadow-md transition-all">
                             <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner ${l.type === "quiz" ? "bg-amber-50" : "bg-indigo-50"}`}>
                                   {l.type === "quiz" ? "📝" : "📖"}
                                </div>
                                <div>
                                   <p className="font-black text-slate-700 leading-tight mb-0.5">{l.title}</p>
                                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{l.type === "quiz" ? "Final Assessment" : "Interactive Lecture"}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-2 opacity-0 group-hover/lesson:opacity-100 transition-opacity">
                                <button 
                                  className="w-10 h-10 rounded-xl bg-white border border-red-100 text-red-400 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center text-sm"
                                  onClick={() => handleDeleteLesson(l.id)}
                                >
                                   🗑️
                                </button>
                             </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Student Roster */}
                  <div className="premium-card !p-8">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-8 flex items-center gap-3">
                       Student Roster <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-xs font-black">{subjectStudents.length}</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {subjectStudents.length === 0 ? (
                        <div className="col-span-full py-10 text-center text-slate-400 font-bold italic">Waiting for kittens to join... 🐾</div>
                      ) : (
                        subjectStudents.map((s) => (
                          <div key={s.id} className="p-4 bg-slate-50 hover:bg-white border border-slate-100 hover:shadow-md rounded-2xl flex items-center justify-between group/stud transition-all">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-light to-secondary/5 flex items-center justify-center font-black text-primary text-sm shadow-inner group-hover/stud:scale-110 transition-transform">
                                   {(s.name || "?")[0].toUpperCase()}
                                </div>
                                <div>
                                   <p className="font-bold text-slate-700 text-sm leading-tight">{s.name}</p>
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lvl {s.level || 1} • {s.grade}</p>
                                </div>
                             </div>
                             <button 
                               className="w-8 h-8 rounded-lg bg-white border border-slate-100 text-slate-300 hover:text-red-500 hover:border-red-100 transition-all flex items-center justify-center opacity-0 group-hover/stud:opacity-100"
                               onClick={() => handleRemoveStudent(s.id)}
                             >
                                ✕
                             </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* ========== CREATE TAB ========== */}
        {activeTab === "add" && (
          <div className="animate-fade-in max-w-4xl mx-auto pb-20">
             <div className="mb-10 text-center">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Academy Workshop 🛠️</h2>
                <p className="text-slate-500 font-medium">Craft new lessons, examinations, or entire subjects.</p>
             </div>

             <div className="glass-panel !p-10 shadow-2xl border-none relative overflow-hidden">
                <div className="relative z-10">
                   <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-10 max-w-md mx-auto">
                      {['subject', 'lecture', 'quiz'].map((type) => (
                        <button 
                          key={type}
                          className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${contentType === type ? 'bg-white text-primary shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                          onClick={() => setContentType(type)}
                        >
                          {type === 'subject' ? '📚 Subject' : type === 'lecture' ? '📖 Lesson' : '📝 Exam'}
                        </button>
                      ))}
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 block">Target Grade</label>
                         <select 
                           className="input-field !py-4" 
                           value={newContent.grade} 
                           onChange={(e) => setNewContent({...newContent, grade: e.target.value})}
                         >
                            {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
                         </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 block">
                           {contentType === "subject" ? "Subject Identity (Icon)" : "Select Parent Subject"}
                        </label>
                        {contentType === "subject" ? (
                          <div className="flex gap-2">
                             <input 
                              type="text" 
                              placeholder="🧪" 
                              className="input-field !w-20 text-center text-xl" 
                              value={newContent.subjectIcon} 
                              onChange={(e) => setNewContent({...newContent, subjectIcon: e.target.value})} 
                             />
                             <div className="flex-1 flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
                                {["📚", "🧪", "🧮", "🎨", "🌍", "🎵", "💻", "🏀", "🍎", "🐾", "🚀", "🧬"].map(icon => (
                                  <button 
                                    key={icon} 
                                    className={`w-11 h-11 min-w-[2.75rem] rounded-xl border flex items-center justify-center text-xl transition-all ${newContent.subjectIcon === icon ? 'bg-primary-light/20 border-primary text-primary' : 'bg-slate-50 border-slate-100'}`}
                                    onClick={() => setNewContent({...newContent, subjectIcon: icon})}
                                  >
                                     {icon}
                                  </button>
                                ))}
                             </div>
                          </div>
                        ) : (
                          <select 
                            className="input-field !py-4" 
                            value={newContent.subjectTitle} 
                            onChange={(e) => setNewContent({...newContent, subjectTitle: e.target.value})}
                          >
                             <option value="">-- Choose Subject --</option>
                             {Object.entries(customCurriculum).map(([g, subs]) => 
                               Array.isArray(subs) ? subs.map(s => <option key={s.id} value={s.title}>{s.title} ({g})</option>) : null
                             )}
                          </select>
                        )}
                      </div>
                   </div>

                   {contentType === "subject" && (
                     <div className="bg-slate-50 rounded-2xl p-5 mb-8 flex items-center justify-between border border-slate-100">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl">🌍</div>
                           <div>
                              <p className="font-black text-slate-700 text-sm leading-tight">Public Curriculum</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visible to all students in {newContent.grade}</p>
                           </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                           <input 
                             type="checkbox" 
                             className="sr-only peer" 
                             checked={newContent.isPublic}
                             onChange={(e) => setNewContent({...newContent, isPublic: e.target.checked})}
                           />
                           <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                     </div>
                   )}

                   <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 block">
                           {contentType === "subject" ? "Course Title" : "Lesson Title"}
                        </label>
                        <input 
                          type="text" 
                          placeholder={contentType === "subject" ? "e.g. Advanced Alchemy 101" : "e.g. Introduction to Potion Making"} 
                          className="input-field !py-4" 
                          value={contentType === "subject" ? newContent.subjectTitle : newContent.title} 
                          onChange={(e) => {
                            if (contentType === "subject") setNewContent({...newContent, subjectTitle: e.target.value});
                            else setNewContent({...newContent, title: e.target.value});
                          }} 
                        />
                      </div>

                      {contentType === "lecture" && (
                         <div className="space-y-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 block">Media Reference (Optional)</label>
                               <input 
                                 type="text" 
                                 placeholder="Paste direct Image URL or YouTube Link..." 
                                 className="input-field !py-4" 
                                 value={newContent.mediaUrl}
                                 onChange={(e) => setNewContent({...newContent, mediaUrl: e.target.value})}
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 block">Curriculum Content</label>
                               <textarea 
                                 className="input-field !rounded-3xl !py-6 min-h-[300px] resize-none" 
                                 placeholder="Unleash your wisdom here... 🐾"
                                 value={newContent.content}
                                 onChange={(e) => setNewContent({...newContent, content: e.target.value})}
                               />
                            </div>
                         </div>
                      )}

                      {contentType === "quiz" && (
                        <div className="space-y-6 pb-4">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 block">Examination Questions</label>
                           {newContent.questions.map((q, idx) => (
                             <div key={idx} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4 shadow-inner">
                                <input 
                                  type="text" 
                                  placeholder={`Question #${idx + 1}`} 
                                  className="input-field !bg-white !shadow-none !border-slate-200" 
                                  value={q.q} 
                                  onChange={(e) => {
                                    const qs = [...newContent.questions]; qs[idx].q = e.target.value; setNewContent({...newContent, questions: qs});
                                  }} 
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                   {q.options.map((opt, oIdx) => (
                                     <input 
                                       key={oIdx} 
                                       type="text" 
                                       placeholder={`Option ${oIdx + 1}`} 
                                       className="w-full text-xs font-bold p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 ring-primary-light/50 transition-all" 
                                       value={opt} 
                                       onChange={(e) => {
                                         const qs = [...newContent.questions]; qs[idx].options[oIdx] = e.target.value; setNewContent({...newContent, questions: qs});
                                       }} 
                                     />
                                   ))}
                                </div>
                                <div className="flex items-center gap-3">
                                   <div className="flex-1 relative">
                                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm">✅</span>
                                      <input 
                                        type="text" 
                                        placeholder="Correct Answer" 
                                        className="w-full text-xs font-black pl-10 pr-4 py-3 bg-white border-2 border-green-100 rounded-xl outline-none focus:ring-2 ring-green-100 text-green-600 transition-all" 
                                        value={q.a} 
                                        onChange={(e) => {
                                          const qs = [...newContent.questions]; qs[idx].a = e.target.value; setNewContent({...newContent, questions: qs});
                                        }} 
                                      />
                                   </div>
                                   <button 
                                     className="w-11 h-11 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-100"
                                     onClick={() => {
                                       const qs = newContent.questions.filter((_, i) => i !== idx);
                                       setNewContent({...newContent, questions: qs});
                                     }}
                                   >
                                      🗑️
                                   </button>
                                </div>
                             </div>
                           ))}
                           <button 
                             className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-black text-xs uppercase tracking-widest hover:border-primary-light hover:text-primary transition-all flex items-center justify-center gap-2" 
                             onClick={() => setNewContent({...newContent, questions: [...newContent.questions, { q: "", options: ["", "", "", ""], a: "" }]})}
                           >
                              <span className="text-xl leading-none">+</span> Add Another Question
                           </button>
                        </div>
                      )}
                   </div>

                   <button className="btn-primary !py-5 mt-10 w-full shadow-2xl shadow-primary/20 flex items-center justify-center gap-3" onClick={handleSaveContent}>
                      Commit to Curriculum Library 🚀
                   </button>
                </div>
                
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-light opacity-[0.05] rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-blue opacity-[0.05] rounded-full blur-3xl -ml-32 -mb-32"></div>
             </div>
          </div>
        )}

        {/* ========== SECTION SETUP TAB (Headmaster ONLY) ========== */}
        {activeTab === "setup" && (
          <div className="animate-fade-in max-w-5xl mx-auto pb-20">
             <div className="mb-10 text-center">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Academic Structure 🏫</h2>
                <p className="text-slate-500 font-medium">Fine-tune your grades and sections for better organization.</p>
             </div>
             
             <div className="space-y-8">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} className="premium-card group hover:shadow-xl transition-all border-slate-100">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 bg-primary-light/20 text-primary rounded-2xl flex items-center justify-center text-2xl shadow-inner font-black">
                              {n}
                           </div>
                           <div>
                              <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">Grade {n}</h3>
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Year Group Management</p>
                           </div>
                        </div>
                        <button 
                          className="btn-primary !py-2.5 !px-6 !text-[10px] !rounded-xl !shadow-none hover:!shadow-lg transition-all" 
                          onClick={() => {
                            const newSections = [...(sectionConfig[n.toString()] || []), `Section ${(sectionConfig[n.toString()] || []).length + 1}`];
                            setSectionConfig({ ...sectionConfig, [n]: newSections });
                          }}
                        >
                          + Add Section
                        </button>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {(sectionConfig[n.toString()] || []).map((s, idx) => (
                          <div key={idx} className="relative group/input">
                            <input 
                              type="text" 
                              className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 ring-primary-light/50 outline-none transition-all"
                              value={s}
                              onChange={(e) => {
                                const newSections = [...sectionConfig[n.toString()]];
                                newSections[idx] = e.target.value;
                                setSectionConfig({ ...sectionConfig, [n]: newSections });
                              }}
                            />
                            <button 
                              onClick={() => {
                                const newSections = sectionConfig[n.toString()].filter((_, i) => i !== idx);
                                setSectionConfig({ ...sectionConfig, [n]: newSections });
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group/input group-hover/input:opacity-100"
                            >×</button>
                          </div>
                        ))}
                        {(sectionConfig[n.toString()] || []).length === 0 && (
                           <div className="col-span-full py-6 text-center text-slate-300 font-bold italic border-2 border-dashed border-slate-100 rounded-2xl">
                              No sections configured for this grade.
                           </div>
                        )}
                     </div>
                  </div>
                ))}
             </div>
             
             <div className="mt-12 glass-panel border-dashed border-2 border-primary-light/30 !p-8">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-xl">📜</div>
                   <h4 className="font-black text-slate-700 tracking-tight">Active Grade Catalog Preview</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                   {gradeOptions.map(g => (
                      <span key={g} className="px-3 py-1.5 bg-white border border-slate-100 rounded-full text-[10px] font-black text-primary uppercase tracking-widest shadow-sm">{g}</span>
                   ))}
                </div>
             </div>

             <button className="btn-primary !py-5 mt-10 w-full shadow-2xl shadow-primary/20 flex items-center justify-center gap-3" onClick={() => {
                alert("Educational structure synchronized! 🎉 Changes have been pushed to all registration forms.");
             }}>
                Authorize Structure Update 🚀
             </button>
          </div>
        )}

        {/* ========== INVITES TAB ========== */}
        {activeTab === "invites" && (
          <div className="animate-fade-in max-w-5xl mx-auto pb-20">
             <div className="mb-10 text-center">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Credential Nexus 🎫</h2>
                <p className="text-slate-500 font-medium">Verify new residents of the Academy with secure access tokens.</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {(currentUser?.role === 'Headmaster' || currentUser?.role === 'Creator') && (
                  <div className="premium-card group hover:-translate-y-1 transition-all border-none bg-gradient-to-br from-indigo-50 to-white shadow-xl !p-8 flex flex-col items-center text-center">
                     <div className="w-20 h-20 bg-white rounded-3xl shadow-lg flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-500">👩‍🏫</div>
                     <h4 className="text-xl font-black text-slate-800 tracking-tight mb-2">Faculty Onboarding</h4>
                     <p className="text-sm font-medium text-slate-400 mb-8 max-w-[240px]">Issue a high-security token for a new Teacher to join your staff.</p>
                     <button className="btn-primary !py-3.5 w-full shadow-lg shadow-primary/20" onClick={() => handleGenerateInvite('Teacher')}>Issue Teacher Token 🎫</button>
                  </div>
                )}
                
                {(currentUser?.role === 'Teacher' || currentUser?.role === 'Headmaster') && (
                  <div className="premium-card group hover:-translate-y-1 transition-all border-none bg-gradient-to-br from-primary-light/10 to-white shadow-xl !p-8 flex flex-col items-center text-center">
                     <div className="w-20 h-20 bg-white rounded-3xl shadow-lg flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-500">🎒</div>
                     <h4 className="text-xl font-black text-slate-800 tracking-tight mb-2">Student Verification</h4>
                     <p className="text-sm font-medium text-slate-400 mb-8 max-w-[240px]">Generate a standard verification code for a legit student registration.</p>
                     <button className="btn-secondary !border-primary !text-primary !py-3.5 w-full hover:!bg-primary hover:!text-white transition-all shadow-md" onClick={() => handleGenerateInvite('Student')}>Issue Student Token 🎟️</button>
                  </div>
                )}
             </div>

             <div className="premium-card !p-0 overflow-hidden shadow-2xl border-none">
                <div className="bg-slate-800 p-6 flex items-center justify-between text-white">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl">📋</div>
                      <h3 className="text-lg font-black tracking-tight">Active Registry of Tokens</h3>
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total: {invites?.length || 0}</span>
                </div>
                <div className="hidden md:block overflow-x-auto no-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Token</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Role</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Operational State</th>
                        <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Expiration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(invites || []).map((inv, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                               <span className="text-sm font-black text-indigo-500 font-mono tracking-wider bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100/50">{inv.code}</span>
                               {!inv.is_used && (
                                 <button 
                                   className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-primary hover:border-primary-light shadow-sm"
                                   onClick={() => {
                                     navigator.clipboard.writeText(inv.code);
                                     alert("Access token copied to clipboard! 📋");
                                   }}
                                   title="Copy Code"
                                 >
                                    📋
                                 </button>
                               )}
                            </div>
                          </td>
                          <td className="p-5 text-sm font-bold text-slate-600">
                             <span className={`px-2 py-0.5 rounded-md uppercase text-[9px] font-black tracking-widest ${inv.role_to_grant === 'Teacher' ? 'bg-indigo-100 text-indigo-600' : 'bg-primary-light/20 text-primary'}`}>
                                {inv.role_to_grant}
                             </span>
                          </td>
                          <td className="p-5 text-center">
                             {inv.is_used ? (
                               <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full bg-slate-100 text-slate-400 uppercase tracking-widest">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Depleted
                               </span>
                             ) : (
                               <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full bg-green-50 text-green-500 uppercase tracking-widest">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Valid
                               </span>
                             )}
                          </td>
                          <td className="p-5 text-right font-bold text-slate-400 text-[10px] uppercase tracking-widest whitespace-nowrap">
                             {inv.is_used ? '-' : (() => {
                               const expiryDate = new Date(new Date(inv.created_at).getTime() + 24 * 60 * 60 * 1000);
                               const timeLeft = expiryDate.getTime() - new Date().getTime();
                               const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                               const minsLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                               return timeLeft > 0 ? `${hoursLeft}h ${minsLeft}m Left` : "Expired";
                             })()}
                          </td>
                        </tr>
                      ))}
                      {(!invites || invites.length === 0) && (
                        <tr>
                          <td colSpan="4" className="p-20 text-center text-slate-400 font-bold italic tracking-wider opacity-30">
                             The token registry is currently empty.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
