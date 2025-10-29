"use client"

import { useState, useEffect } from "react"
import { useSession, signIn, signOut, SessionProvider } from "next-auth/react"
import {
  ChevronRight, ChevronDown, Calendar, FileText, Tag, Flag, Type, Sun, Plus, MoreHorizontal, Bell, // Added Bell
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Task {
  id: string
  name: string
  status: "Not started" | "In progress" | "Done" | "Cancelled" | "Archived"
  due?: string
  priority: "Low" | "Medium" | "High"
  tags: string[]
  subtasks?: Task[]
  isExpanded?: boolean
}

// Wrapper component to provide session context
export default function TaskManagerPage() {
  return (
    <SessionProvider>
      <TaskManager />
    </SessionProvider>
  )
}

function TaskManager() {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({ name: "", status: "Not started", priority: "Medium", tags: [] });
  const [newTag, setNewTag] = useState("");
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);

  // --- NEW STATES FOR REMINDERS ---
  const [reminders, setReminders] = useState<{ [key: string]: { eventId: string; reminderDate: string } }>({});
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [currentTarget, setCurrentTarget] = useState<{ id: string, name: string } | null>(null);
  const [reminderDateTime, setReminderDateTime] = useState("");
  
  // --- DATA HANDLING & LOGIC ---

  const saveTasks = async (tasksToSave: Task[]) => {
    try {
      await fetch("/api/tasks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tasksToSave, null, 2),
      })
    } catch (error) { console.error("Failed to save tasks:", error) }
  }

  useEffect(() => {
    fetch("/api/tasks").then(res => res.json()).then(data => setTasks(data))
      .catch(err => { console.error("Failed to load tasks from API", err); setTasks([]) })
    
    if (status === 'authenticated') {
      fetch("/api/reminders").then(res => res.json()).then(data => setReminders(data || {}))
        .catch(err => { console.error("Failed to load reminders from API", err); setReminders({}) });
    }
  }, [status])

  useEffect(() => { if (tasks.length > 0) { saveTasks(tasks) } }, [tasks])
  
  // --- NEW REMINDER LOGIC ---

  const handleSetReminderClick = (task: { id: string, name: string }) => {
    setCurrentTarget(task);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setReminderDateTime(tomorrow.toISOString().slice(0, 16));
    setIsReminderModalOpen(true);
  };
  
  const handleSaveReminder = async () => {
    if (!currentTarget || !reminderDateTime) return;
    try {
        const res = await fetch("/api/reminders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                taskId: currentTarget.id,
                taskName: currentTarget.name,
                reminderDateTime: new Date(reminderDateTime).toISOString(),
            })
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to set reminder');
        }
        const newReminder = await res.json();
        setReminders(prev => ({ ...prev, [newReminder.taskId]: { eventId: newReminder.eventId, reminderDate: newReminder.reminderDate } }));
        setIsReminderModalOpen(false);
        setCurrentTarget(null);
    } catch(error) {
        console.error("Error setting reminder:", error);
        alert(String(error));
    }
  };

  const handleDeleteReminder = async (taskId: string, skipConfirm = false) => {
    if (!reminders[taskId]) return;
    if (!skipConfirm && !window.confirm("Are you sure you want to delete this reminder from your Google Calendar?")) return;
    try {
        const res = await fetch(`/api/reminders/${taskId}`, { method: "DELETE" });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to delete reminder');
        }
        setReminders(prev => {
            const newReminders = { ...prev };
            delete newReminders[taskId];
            return newReminders;
        });
    } catch (error) {
        console.error("Error deleting reminder:", error);
        if(!skipConfirm) alert(String(error));
    }
  };

  // --- MODIFIED & EXISTING TASK LOGIC ---

  const deleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task? This will also remove the Google Calendar reminder if one is set.")) return;
    
    // Delete reminder first, if it exists (skip confirmation)
    if (reminders[taskId] && status === 'authenticated') {
        await handleDeleteReminder(taskId, true);
    }

    const deleteRecursively = (tasks: Task[], id: string): Task[] => tasks
      .filter(task => task.id !== id)
      .map(task => task.subtasks ? { ...task, subtasks: deleteRecursively(task.subtasks, id) } : task);
    setTasks(prevTasks => deleteRecursively(prevTasks, taskId));
  }

  // --- UNCHANGED FUNCTIONS from here on ---
  const toggleTaskExpansion = (taskId: string) => {
    setTasks(prevTasks => {
      const toggleRecursively = (currentTasks: Task[]): Task[] => currentTasks.map(task => 
        task.id === taskId ? { ...task, isExpanded: !task.isExpanded } :
        task.subtasks ? { ...task, subtasks: toggleRecursively(task.subtasks) } : task
      );
      return toggleRecursively(prevTasks);
    });
  }
  const addTask = (parentId?: string | null) => {
    const task: Task = {
      id: Date.now().toString(), name: newTask.name || "Untitled Task",
      status: newTask.status || "Not started", due: newTask.due,
      priority: newTask.priority || "Medium", tags: newTask.tags || [], subtasks: [],
    };
    if (parentId) {
      const addSubtaskRecursively = (tasks: Task[], pId: string, newTask: Task): Task[] => tasks.map(t =>
        t.id === pId ? { ...t, subtasks: [...(t.subtasks || []), newTask], isExpanded: true } :
        t.subtasks ? { ...t, subtasks: addSubtaskRecursively(t.subtasks, pId, newTask) } : t
      );
      setTasks(prevTasks => addSubtaskRecursively(prevTasks, parentId, task));
    } else {
      setTasks(prevTasks => [...prevTasks, task]);
    }
    setIsAddTaskOpen(false);
  }
  const updateTask = (updatedTask: Task) => {
    const updateRecursively = (tasks: Task[]): Task[] => tasks.map(task =>
      task.id === updatedTask.id ? { ...task, ...updatedTask } :
      task.subtasks ? { ...task, subtasks: updateRecursively(task.subtasks) } : task
    );
    setTasks(prevTasks => updateRecursively(prevTasks));
    setIsAddTaskOpen(false);
  }
  const handleSaveTask = () => {
    if (newTask.id) { updateTask(newTask as Task) } 
    else { addTask(currentParentId) }
  }
  const editTask = (taskToEdit: Task) => {
    setNewTask({ ...taskToEdit });
    setCurrentParentId(null);
    setIsAddTaskOpen(true);
  }
  const handleToggleDone = (taskId: string, currentStatus: Task["status"]) => {
    updateTaskStatus(taskId, currentStatus === "Done" ? "In progress" : "Done");
  };
  const updateTaskStatus = (taskId: string, newStatus: Task["status"]) => {
    const updateStatusRecursively = (tasks: Task[]): Task[] => tasks.map(task =>
      task.id === taskId ? { ...task, status: newStatus } :
      task.subtasks ? { ...task, subtasks: updateStatusRecursively(task.subtasks) } : task
    );
    setTasks(prevTasks => updateStatusRecursively(prevTasks));
  };
  const addTagToNewTask = () => {
    if (newTag.trim()) {
      setNewTask(prev => ({ ...prev, tags: [...(prev.tags || []), newTag.trim()] }));
      setNewTag("");
    }
  };
  const removeTagFromNewTask = (tagToRemove: string) => {
    setNewTask(prev => ({ ...prev, tags: prev.tags?.filter(tag => tag !== tagToRemove) || [] }));
  };
  const getStatusComponent = (status: string) => {
    const configs = { "Not started": { color: "text-gray-400", dot: "bg-gray-400" }, "In progress": { color: "text-cyan-400", dot: "bg-cyan-400" }, Done: { color: "text-green-400", dot: "bg-green-400" }, Cancelled: { color: "text-red-400", dot: "bg-red-400" }, Archived: { color: "text-gray-500", dot: "bg-gray-500" } };
    const config = configs[status as keyof typeof configs];
    return (<div className="inline-flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${config.dot}`}></div><span className={config.color}>{status}</span></div>);
  };
  const getPriorityBadge = (priority: string) => {
    const configs = { High: "bg-red-500/20 text-red-400", Medium: "bg-yellow-400/20 text-yellow-300", Low: "bg-green-500/20 text-green-400" };
    const config = configs[priority as keyof typeof configs];
    return config ? <Badge className={`px-2 py-0.5 text-xs font-normal border-0 ${config}`}>{priority}</Badge> : null;
  };
  const getTagBadge = (tag: string) => {
    let colorClass = "bg-gray-600/50 text-gray-300";
    if (tag.toLowerCase() === "improvement") colorClass = "bg-purple-500/20 text-purple-300";
    else if (tag.toLowerCase() === "website") colorClass = "bg-cyan-400/20 text-cyan-300";
    return <Badge className={`px-2 py-0.5 text-xs font-normal border-0 ${colorClass}`}>{tag}</Badge>;
  };
  
  // --- RENDERER ---
  const renderTaskRow = (task: Task, level = 0) => {
    const reminder = reminders[task.id];
    return (
    <div key={task.id} className="group">
      <div className="flex items-center border-b border-[#44475A] hover:bg-[#44475A]/40 transition-colors duration-150 text-sm">
        <div className="flex items-center py-2.5 px-4 flex-1 truncate border-r border-[#44475A] min-w-[20rem]" style={{ paddingLeft: `${16 + level * 24}px` }}>
          <div className="w-5 mr-2 flex-shrink-0">{task.subtasks && (<button onClick={() => toggleTaskExpansion(task.id)} className="align-middle">{task.isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}</button>)}</div>
          <input type="checkbox" checked={task.status === "Done"} onChange={() => handleToggleDone(task.id, task.status)} className="w-4 h-4 mr-3 rounded-sm cursor-pointer flex-shrink-0 bg-[#44475A] border-[#6272A4] text-pink-500 focus:ring-pink-500 focus:ring-offset-0 focus:ring-1" />
          <FileText className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
          <span className={`truncate transition-colors ${task.status === 'Done' ? 'line-through text-gray-500' : 'text-gray-300'}`}>{task.name}</span>
        </div>
        <div className="flex items-center py-2.5 px-4 w-48 border-r border-[#44475A]">{getStatusComponent(task.status)}</div>
        <div className="flex items-center py-2.5 px-4 w-40 border-r border-[#44475A]">
            {reminder ? (<div className="flex items-center text-xs text-green-400 gap-2"><Bell className="w-4 h-4" /><div className="flex flex-col"><span>{new Date(reminder.reminderDate).toLocaleDateString()}</span><span className="text-gray-400 -mt-1">{new Date(reminder.reminderDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div></div>) 
            : (<span className="text-gray-500 text-xs">Not set</span>)}
        </div>
        <div className="flex items-center py-2.5 px-4 w-40 text-gray-400 border-r border-[#44475A]">{task.due || ""}</div>
        <div className="flex items-center py-2.5 px-4 w-32 border-r border-[#44475A]">{task.priority && getPriorityBadge(task.priority)}</div>
        <div className="flex items-center py-2.5 px-4 w-48"><div className="flex flex-wrap gap-1">{task.tags?.map((tag) => getTagBadge(tag))}</div></div>
        <div className="flex items-center justify-center py-2.5 px-4 w-16">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 transition-opacity text-gray-400 hover:bg-[#44475A] hover:text-gray-200"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1E1F28] border-[#44475A] text-gray-300">
              <DropdownMenuItem onClick={() => { setCurrentParentId(task.id); setNewTask({ name: "", status: "Not started", priority: "Medium", tags: [] }); setIsAddTaskOpen(true); }} className="hover:!bg-[#44475A] cursor-pointer">Add Sub-task</DropdownMenuItem>
              <DropdownMenuItem onClick={() => editTask(task)} className="hover:!bg-[#44475A] cursor-pointer">Edit Task</DropdownMenuItem>
              {status === 'authenticated' && (reminder ? <DropdownMenuItem onClick={() => handleDeleteReminder(task.id)} className="hover:!bg-[#44475A] cursor-pointer text-yellow-400">Delete Reminder</DropdownMenuItem> : <DropdownMenuItem onClick={() => handleSetReminderClick(task)} className="hover:!bg-[#44475A] cursor-pointer">Set Reminder</DropdownMenuItem>)}
              <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-red-400 hover:!bg-red-500/20 hover:!text-red-300 cursor-pointer">Delete Task</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {task.isExpanded && task.subtasks && task.subtasks.map((subtask) => renderTaskRow(subtask, level + 1))}
    </div>
  )};

  const scrollbarStyles = `...`; // Unchanged

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="min-h-screen bg-[#282A36] text-gray-300 font-sans p-4 sm:p-6 lg:p-8">
        {/* MODAL FOR ADDING/EDITING TASKS */}
        <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
          {/* This DialogTrigger is now part of the main header */}
          <DialogContent className="bg-[#1E1F28] border-[#44475A] text-gray-300">{/* ... Unchanged Content ... */}</DialogContent>
        </Dialog>
        
        {/* NEW MODAL FOR SETTING REMINDERS */}
        <Dialog open={isReminderModalOpen} onOpenChange={setIsReminderModalOpen}>
          <DialogContent className="bg-[#1E1F28] border-[#44475A] text-gray-300">
            <DialogHeader><DialogTitle className="text-gray-100">Set Reminder for "{currentTarget?.name}"</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div><Label htmlFor="reminderDateTime">Reminder Date and Time</Label><Input id="reminderDateTime" type="datetime-local" value={reminderDateTime} onChange={e => setReminderDateTime(e.target.value)} className="mt-1 bg-[#282A36] border-[#44475A]" /></div>
              <Button onClick={handleSaveReminder} className="w-full bg-pink-600 hover:bg-pink-700">Set on Google Calendar</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* --- PAGE HEADER --- */}
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-100">TASKER PRO</h1>
            <div className="flex items-center gap-4">
              {status === 'authenticated' ? (<Button onClick={() => signOut()} variant="outline" className="bg-transparent border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white">Sign Out</Button>) : (<Button onClick={() => signIn('google')} variant="outline" className="bg-transparent border-pink-600 text-pink-500 hover:bg-pink-600 hover:text-white">Sign In with Google</Button>)}
              <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {setCurrentParentId(null); setNewTask({name: "", status: "Not started", priority: "Medium", tags: []}); setIsAddTaskOpen(true);}} className="bg-pink-600 hover:bg-pink-700 text-white"><Plus className="w-4 h-4 mr-2" />Add New Task</Button>
                </DialogTrigger>
              </Dialog>
            </div>
        </div>
        
        {/* --- TASK TABLE --- */}
        <div className="w-full overflow-x-auto scrollbar-custom">
          <div className="min-w-[80rem]">
            <div className="flex items-center border-y border-[#44475A] bg-[#282A36]/80 backdrop-blur-sm text-xs font-medium text-gray-400 sticky top-0 z-10">
              <div className="flex items-center gap-2 py-2 px-4 flex-1 border-r border-[#44475A] min-w-[20rem]"><Type className="w-3.5 h-3.5" /><span>Task name</span></div>
              <div className="flex items-center gap-2 py-2 px-4 w-48 border-r border-[#44475A]"><Sun className="w-3.5 h-3.5" /><span>Status</span></div>
              <div className="flex items-center gap-2 py-2 px-4 w-40 border-r border-[#44475A]"><Bell className="w-3.5 h-3.5" /><span>Reminder</span></div>
              <div className="flex items-center gap-2 py-2 px-4 w-40 border-r border-[#44475A]"><Calendar className="w-3.5 h-3.5" /><span>Due</span></div>
              <div className="flex items-center gap-2 py-2 px-4 w-32 border-r border-[#44475A]"><Flag className="w-3.5 h-3.5" /><span>Priority</span></div>
              <div className="flex items-center gap-2 py-2 px-4 w-48"><Tag className="w-3.5 h-3.5" /><span>Tags</span></div>
              <div className="py-2.5 px-4 w-16"></div>
            </div>
            <div>{tasks.map((task) => renderTaskRow(task))}</div>
          </div>
        </div>
      </div>
    </>
  );
}