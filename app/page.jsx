"use client"

import { useState, useEffect } from "react"
import {
  ChevronRight, ChevronDown, Calendar, FileText, Tag, Flag, Type, Sun, Plus, MoreHorizontal, Bell, ArrowUpDown,
} from "lucide-react"
import { CalendarIcon } from "@radix-ui/react-icons"
import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"



function ThemedDateTimePicker({ date, setDate }) {
  const [isOpen, setIsOpen] = useState(false);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  useEffect(() => {
    if (isOpen && !date) {
      setDate(new Date());
    }
  }, [isOpen, date, setDate]);

  const handleDateSelect = (selectedDate) => {
    if (selectedDate) {
      const newDate = date ? new Date(date) : new Date();
      newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setDate(newDate);
    }
  };

  const handleTimeChange = (
    type,
    value
  ) => {
    if (date) {
      const newDate = new Date(date);
      if (type === "hour") {
        const selectedHour = parseInt(value);
        const currentIsPM = newDate.getHours() >= 12;
        if (currentIsPM) {
            newDate.setHours(selectedHour === 12 ? 12 : selectedHour + 12);
        } else {
            newDate.setHours(selectedHour === 12 ? 0 : selectedHour);
        }
      } else if (type === "minute") {
        newDate.setMinutes(parseInt(value));
      } else if (type === "ampm") {
        const currentHours = newDate.getHours();
        if (value === "PM" && currentHours < 12) {
          newDate.setHours(currentHours + 12);
        } else if (value === "AM" && currentHours >= 12) {
          newDate.setHours(currentHours - 12);
        }
      }
      setDate(newDate);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-[#282A36] border-[#44475A] hover:bg-[#44475A]/40",
            !date && "text-gray-500"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "MM/dd/yyyy hh:mm aa") : <span>Pick a date and time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-[#1E1F28] border-[#44475A] text-gray-300">
        <div className="sm:flex">
          <ShadcnCalendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            className="bg-[#1E1F28]"
            classNames={{
              day_selected: "bg-pink-600 text-white hover:bg-pink-700",
              day_today: "border border-pink-600",
            }}
          />
          <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x border-t sm:border-t-0 sm:border-l border-[#44475A]">
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {hours.map((hour) => (
                  <Button
                    key={hour}
                    size="icon"
                    variant={date && (date.getHours() % 12 || 12) === hour ? "default" : "ghost"}
                    className="sm:w-full shrink-0 aspect-square hover:!bg-[#44475A] data-[state=active]:bg-pink-600"
                    onClick={() => handleTimeChange("hour", hour.toString())}
                  >
                    {hour}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {minutes.map((minute) => (
                  <Button
                    key={minute}
                    size="icon"
                    variant={date && date.getMinutes() === minute ? "default" : "ghost"}
                    className="sm:w-full shrink-0 aspect-square hover:!bg-[#44475A]"
                    onClick={() => handleTimeChange("minute", minute.toString())}
                  >
                    {minute.toString().padStart(2, "0")}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            <ScrollArea className="">
              <div className="flex sm:flex-col p-2">
                {["AM", "PM"].map((ampm) => (
                  <Button
                    key={ampm}
                    size="icon"
                    variant={
                      date &&
                      ((ampm === "AM" && date.getHours() < 12) ||
                        (ampm === "PM" && date.getHours() >= 12))
                        ? "default"
                        : "ghost"
                    }
                    className="sm:w-full shrink-0 aspect-square hover:!bg-[#44475A]"
                    onClick={() => handleTimeChange("ampm", ampm)}
                  >
                    {ampm}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}


export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({ name: "", status: "Not started", priority: "Medium", tags: [] });
  const [newTag, setNewTag] = useState("");
  const [currentParentId, setCurrentParentId] = useState(null);

  const [reminders, setReminders] = useState({});
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [currentTarget, setCurrentTarget] = useState(null);
  // --- STATE CHANGE: Use a Date object for the new picker ---
  const [reminderDate, setReminderDate] = useState();
  
  // Sort configuration state
  const [sortConfig, setSortConfig] = useState({ primary: null, secondary: null });
  
  const saveTasks = async (tasksToSave) => {
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
    
    fetch("/api/reminders").then(res => res.json()).then(data => setReminders(data || {}))
      .catch(err => { console.error("Failed to load reminders from API", err); setReminders({}) });
  }, [])

  useEffect(() => { if (tasks.length > 0) { saveTasks(tasks) } }, [tasks])
  
  // Sorting functions
  const getStatusSortValue = (status) => {
    const statusOrder = { "In progress": 0, "Not started": 1, "Archived": 2, "Done": 3, "Cancelled": 4 };
    return statusOrder[status] ?? 999;
  };

  const getPrioritySortValue = (priority) => {
    const priorityOrder = { "High": 0, "Medium": 1, "Low": 2 };
    return priorityOrder[priority] ?? 999;
  };

  const sortTasks = (tasksToSort, config) => {
    if (!config.primary) return tasksToSort;

    return [...tasksToSort].sort((a, b) => {
      // Primary sort
      let primaryCompare = 0;
      switch (config.primary) {
        case "status":
          primaryCompare = getStatusSortValue(a.status) - getStatusSortValue(b.status);
          break;
        case "priority":
          primaryCompare = getPrioritySortValue(a.priority) - getPrioritySortValue(b.priority);
          break;
        case "name":
          primaryCompare = a.name.localeCompare(b.name);
          break;
        case "due":
          const aDate = a.due ? new Date(a.due).getTime() : Number.MAX_SAFE_INTEGER;
          const bDate = b.due ? new Date(b.due).getTime() : Number.MAX_SAFE_INTEGER;
          primaryCompare = aDate - bDate;
          break;
      }

      // If primary comparison is equal and we have a secondary sort, use it
      if (primaryCompare === 0 && config.secondary) {
        switch (config.secondary) {
          case "status":
            return getStatusSortValue(a.status) - getStatusSortValue(b.status);
          case "priority":
            return getPrioritySortValue(a.priority) - getPrioritySortValue(b.priority);
          case "name":
            return a.name.localeCompare(b.name);
          case "due":
            const aDate = a.due ? new Date(a.due).getTime() : Number.MAX_SAFE_INTEGER;
            const bDate = b.due ? new Date(b.due).getTime() : Number.MAX_SAFE_INTEGER;
            return aDate - bDate;
        }
      }

      return primaryCompare;
    }).map(task => ({
      ...task,
      subtasks: task.subtasks ? sortTasks(task.subtasks, config) : task.subtasks
    }));
  };

  const handleSortChange = (field, isPrimary = true) => {
    setSortConfig(prev => {
      if (isPrimary) {
        // If setting the same field as primary, clear it. Otherwise set it and move previous primary to secondary
        if (prev.primary === field) {
          return { primary: null, secondary: prev.secondary };
        } else {
          return { 
            primary: field, 
            secondary: prev.primary !== field ? prev.primary : prev.secondary 
          };
        }
      } else {
        // Setting secondary sort
        if (prev.secondary === field) {
          return { ...prev, secondary: null };
        } else {
          return { ...prev, secondary: field !== prev.primary ? field : null };
        }
      }
    });
  };

  // Get sorted tasks for display
  const sortedTasks = sortTasks(tasks, sortConfig);
  
  const handleSetReminderClick = (task) => {
    setCurrentTarget(task);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setReminderDate(tomorrow);
    setIsReminderModalOpen(true);
  };
  
  const handleSaveReminder = async () => {
    if (!currentTarget || !reminderDate) return;
    try {
        const res = await fetch("/api/reminders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                taskId: currentTarget.id,
                taskName: currentTarget.name,
                reminderDateTime: reminderDate.toISOString(),
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

  // ... (the rest of the logic like handleDeleteReminder, deleteTask, etc. remains the same) ...
  const handleDeleteReminder = async (taskId, skipConfirm = false) => {
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

  const deleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task? This will also remove the Google Calendar reminder if one is set.")) return;
    
    if (reminders[taskId]) {
        await handleDeleteReminder(taskId, true);
    }

    const deleteRecursively = (tasks, id) => tasks
      .filter(task => task.id !== id)
      .map(task => task.subtasks ? { ...task, subtasks: deleteRecursively(task.subtasks, id) } : task);
    setTasks(prevTasks => deleteRecursively(prevTasks, taskId));
  }

  const toggleTaskExpansion = (taskId) => {
    setTasks(prevTasks => {
      const toggleRecursively = (currentTasks) => currentTasks.map(task => 
        task.id === taskId ? { ...task, isExpanded: !task.isExpanded } :
        task.subtasks ? { ...task, subtasks: toggleRecursively(task.subtasks) } : task
      );
      return toggleRecursively(prevTasks);
    });
  }
  const addTask = (parentId) => {
    const task = {
      id: Date.now().toString(), name: newTask.name || "Untitled Task",
      status: newTask.status || "Not started", due: newTask.due,
      priority: newTask.priority || "Medium", tags: newTask.tags || [], subtasks: [],
    };
    if (parentId) {
      const addSubtaskRecursively = (tasks, pId, newTask) => tasks.map(t =>
        t.id === pId ? { ...t, subtasks: [...(t.subtasks || []), newTask], isExpanded: true } :
        t.subtasks ? { ...t, subtasks: addSubtaskRecursively(t.subtasks, pId, newTask) } : t
      );
      setTasks(prevTasks => addSubtaskRecursively(prevTasks, parentId, task));
    } else {
      setTasks(prevTasks => [...prevTasks, task]);
    }
    setIsAddTaskOpen(false);
  }
  const updateTask = (updatedTask) => {
    const updateRecursively = (tasks) => tasks.map(task =>
      task.id === updatedTask.id ? { ...task, ...updatedTask } :
      task.subtasks ? { ...task, subtasks: updateRecursively(task.subtasks) } : task
    );
    setTasks(prevTasks => updateRecursively(prevTasks));
    setIsAddTaskOpen(false);
  }
  const handleSaveTask = () => {
    if (newTask.id) { updateTask(newTask) } 
    else { addTask(currentParentId) }
  }
  const editTask = (taskToEdit) => {
    setNewTask({ ...taskToEdit });
    setCurrentParentId(null);
    setIsAddTaskOpen(true);
  }
  const handleToggleDone = (taskId, currentStatus) => {
    updateTaskStatus(taskId, currentStatus === "Done" ? "In progress" : "Done");
  };
  const updateTaskStatus = (taskId, newStatus) => {
    const updateStatusRecursively = (tasks) => tasks.map(task =>
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
  const removeTagFromNewTask = (tagToRemove) => {
    setNewTask(prev => ({ ...prev, tags: prev.tags?.filter(tag => tag !== tagToRemove) || [] }));
  };
  const getStatusComponent = (status) => {
    const configs = { "Not started": { color: "text-gray-400", dot: "bg-gray-400" }, "In progress": { color: "text-cyan-400", dot: "bg-cyan-400" }, Done: { color: "text-green-400", dot: "bg-green-400" }, Cancelled: { color: "text-red-400", dot: "bg-red-400" }, Archived: { color: "text-gray-500", dot: "bg-gray-500" } };
    const config = configs[status];
    return (<div className="inline-flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${config.dot}`}></div><span className={config.color}>{status}</span></div>);
  };
  const getPriorityBadge = (priority) => {
    const configs = { High: "bg-red-500/20 text-red-400", Medium: "bg-yellow-400/20 text-yellow-300", Low: "bg-green-500/20 text-green-400" };
    const config = configs[priority];
    return config ? <Badge className={`px-2 py-0.5 text-xs font-normal border-0 ${config}`}>{priority}</Badge> : null;
  };
  const getTagBadge = (tag) => {
    let colorClass = "bg-gray-600/50 text-gray-300";
    if (tag.toLowerCase() === "improvement") colorClass = "bg-purple-500/20 text-purple-300";
    else if (tag.toLowerCase() === "website") colorClass = "bg-cyan-400/20 text-cyan-300";
    return <Badge className={`px-2 py-0.5 text-xs font-normal border-0 ${colorClass}`}>{tag}</Badge>;
  };
  
  const renderTaskRow = (task, level = 0) => {
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
            {reminder ? (<div className="flex items-center text-xs text-green-400 gap-2"><Bell className="w-4 h-4" /><div className="flex flex-col"><span>{new Date(reminder.reminderDate).toLocaleString('en-US', {day: 'numeric', month: 'long', year: '2-digit'})}</span><span className="text-gray-400 -mt-1">{new Date(reminder.reminderDate).toLocaleString('en-US', {hour: 'numeric', minute:'2-digit', hour12: true}).toLowerCase()}</span></div></div>) 
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
              {reminder ? <DropdownMenuItem onClick={() => handleDeleteReminder(task.id)} className="hover:!bg-[#44475A] cursor-pointer text-yellow-400">Delete Reminder</DropdownMenuItem> : <DropdownMenuItem onClick={() => handleSetReminderClick(task)} className="hover:!bg-[#44475A] cursor-pointer">Set Reminder</DropdownMenuItem>}
              <DropdownMenuItem onClick={() => deleteTask(task.id)} className="text-red-400 hover:!bg-red-500/20 hover:!text-red-300 cursor-pointer">Delete Task</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {task.isExpanded && task.subtasks && task.subtasks.map((subtask) => renderTaskRow(subtask, level + 1))}
    </div>
  )};

  const scrollbarStyles = `
    .scrollbar-custom::-webkit-scrollbar { width: 8px; height: 8px; }
    .scrollbar-custom::-webkit-scrollbar-track { background: #282A36; }
    .scrollbar-custom::-webkit-scrollbar-thumb { background: #44475A; border-radius: 4px; }
    .scrollbar-custom::-webkit-scrollbar-thumb:hover { background: #6272A4; }
    .dark .rdp { --rdp-cell-size: 32px; --rdp-caption-font-size: 16px; }
  `;

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="min-h-screen bg-[#282A36] text-gray-300 font-sans p-4 sm:p-6 lg:p-8">
        <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
          {/* ... Add Task Dialog Content ... (remains the same) */}
          <DialogContent className="bg-[#1E1F28] border-[#44475A] text-gray-300">
            <DialogHeader><DialogTitle className="text-gray-100">{newTask.id ? 'Edit Task' : 'Add New Task'}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-gray-400">Task</Label>
                <Input id="name" value={newTask.name || ""} onChange={(e) => setNewTask(p => ({ ...p, name: e.target.value }))} className="col-span-3 bg-[#282A36] border-[#44475A]" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right text-gray-400">Status</Label>
                <Select value={newTask.status} onValueChange={(value) => setNewTask(p => ({ ...p, status: value }))}>
                  <SelectTrigger className="col-span-3 bg-[#282A36] border-[#44475A]"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1E1F28] border-[#44475A] text-gray-300">
                    <SelectItem value="Not started">Not started</SelectItem>
                    <SelectItem value="In progress">In progress</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right text-gray-400">Priority</Label>
                <Select value={newTask.priority} onValueChange={(value) => setNewTask(p => ({ ...p, priority: value }))}>
                  <SelectTrigger className="col-span-3 bg-[#282A36] border-[#44475A]"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1E1F28] border-[#44475A] text-gray-300">
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="due" className="text-right text-gray-400">Due Date</Label>
                <Input id="due" type="date" value={newTask.due || ""} onChange={(e) => setNewTask(p => ({ ...p, due: e.target.value }))} className="col-span-3 bg-[#282A36] border-[#44475A]" />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2 text-gray-400">Tags</Label>
                <div className="col-span-3">
                  <div className="flex flex-wrap gap-2 mb-2">{newTask.tags?.map((tag) => (<Badge key={tag} className="bg-gray-600/50 text-gray-300 hover:bg-red-500/20 cursor-pointer" onClick={() => removeTagFromNewTask(tag)}>{tag} ×</Badge>))}</div>
                  <div className="flex gap-2">
                    <Input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTagToNewTask()} placeholder="Add a tag..." className="bg-[#282A36] border-[#44475A]" />
                    <Button onClick={addTagToNewTask} variant="outline" className="bg-transparent border-gray-500 text-gray-300 hover:bg-gray-700">Add</Button>
                  </div>
                </div>
              </div>
            </div>
            <Button onClick={handleSaveTask} className="w-full bg-pink-600 hover:bg-pink-700">{newTask.id ? 'Save Changes' : 'Create Task'}</Button>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isReminderModalOpen} onOpenChange={setIsReminderModalOpen}>
          <DialogContent className="bg-[#1E1F28] border-[#44475A] text-gray-300">
            <DialogHeader><DialogTitle className="text-gray-100">{`Set Reminder for "${currentTarget?.name}"`}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="reminderDateTime" className="mb-2 block">Reminder Date and Time</Label>
                <ThemedDateTimePicker date={reminderDate} setDate={setReminderDate} />
              </div>
              <Button onClick={handleSaveReminder} className="w-full bg-pink-600 hover:bg-pink-700">Set on Google Calendar</Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-100">TASKER PRO</h1>
            <div className="flex items-center gap-4">
              {/* Sort Controls */}
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-400">Sort by:</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Primary:</span>
                  <Select value={sortConfig.primary || "none"} onValueChange={(value) => handleSortChange(value === "none" ? null : value, true)}>
                    <SelectTrigger className="w-32 h-8 bg-[#282A36] border-[#44475A] text-xs">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E1F28] border-[#44475A] text-gray-300">
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="due">Due Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Secondary:</span>
                  <Select value={sortConfig.secondary || "none"} onValueChange={(value) => handleSortChange(value === "none" ? null : value, false)}>
                    <SelectTrigger className="w-32 h-8 bg-[#282A36] border-[#44475A] text-xs">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E1F28] border-[#44475A] text-gray-300">
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="status" disabled={sortConfig.primary === "status"}>Status</SelectItem>
                      <SelectItem value="priority" disabled={sortConfig.primary === "priority"}>Priority</SelectItem>
                      <SelectItem value="name" disabled={sortConfig.primary === "name"}>Name</SelectItem>
                      <SelectItem value="due" disabled={sortConfig.primary === "due"}>Due Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(sortConfig.primary || sortConfig.secondary) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSortConfig({ primary: null, secondary: null })}
                    className="h-8 px-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-[#44475A]"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <Button onClick={() => {setCurrentParentId(null); setNewTask({name: "", status: "Not started", priority: "Medium", tags: []}); setIsAddTaskOpen(true);}} className="bg-pink-600 hover:bg-pink-700 text-white"><Plus className="w-4 h-4 mr-2" />Add New Task</Button>
            </div>
        </div>
        
        <div className="w-full overflow-x-auto scrollbar-custom">
          <div className="min-w-[80rem]">
            {/* ... Table Header ... (remains the same) */}
            <div className="flex items-center border-y border-[#44475A] bg-[#282A36]/80 backdrop-blur-sm text-xs font-medium text-gray-400 sticky top-0 z-10">
              <div className="flex items-center gap-2 py-2 px-4 flex-1 border-r border-[#44475A] min-w-[20rem] cursor-pointer hover:bg-[#44475A]/40" 
                   onClick={() => handleSortChange("name", true)}>
                <Type className="w-3.5 h-3.5" />
                <span>Task name</span>
                {(sortConfig.primary === "name" || sortConfig.secondary === "name") && (
                  <ArrowUpDown className="w-3 h-3 text-pink-400" />
                )}
                {sortConfig.primary === "name" && <span className="text-pink-400 text-xs">1</span>}
                {sortConfig.secondary === "name" && <span className="text-cyan-400 text-xs">2</span>}
              </div>
              <div className="flex items-center gap-2 py-2 px-4 w-48 border-r border-[#44475A] cursor-pointer hover:bg-[#44475A]/40"
                   onClick={() => handleSortChange("status", true)}>
                <Sun className="w-3.5 h-3.5" />
                <span>Status</span>
                {(sortConfig.primary === "status" || sortConfig.secondary === "status") && (
                  <ArrowUpDown className="w-3 h-3 text-pink-400" />
                )}
                {sortConfig.primary === "status" && <span className="text-pink-400 text-xs">1</span>}
                {sortConfig.secondary === "status" && <span className="text-cyan-400 text-xs">2</span>}
              </div>
              <div className="flex items-center gap-2 py-2 px-4 w-40 border-r border-[#44475A]"><Bell className="w-3.5 h-3.5" /><span>Reminder</span></div>
              <div className="flex items-center gap-2 py-2 px-4 w-40 border-r border-[#44475A] cursor-pointer hover:bg-[#44475A]/40"
                   onClick={() => handleSortChange("due", true)}>
                <Calendar className="w-3.5 h-3.5" />
                <span>Due</span>
                {(sortConfig.primary === "due" || sortConfig.secondary === "due") && (
                  <ArrowUpDown className="w-3 h-3 text-pink-400" />
                )}
                {sortConfig.primary === "due" && <span className="text-pink-400 text-xs">1</span>}
                {sortConfig.secondary === "due" && <span className="text-cyan-400 text-xs">2</span>}
              </div>
              <div className="flex items-center gap-2 py-2 px-4 w-32 border-r border-[#44475A] cursor-pointer hover:bg-[#44475A]/40"
                   onClick={() => handleSortChange("priority", true)}>
                <Flag className="w-3.5 h-3.5" />
                <span>Priority</span>
                {(sortConfig.primary === "priority" || sortConfig.secondary === "priority") && (
                  <ArrowUpDown className="w-3 h-3 text-pink-400" />
                )}
                {sortConfig.primary === "priority" && <span className="text-pink-400 text-xs">1</span>}
                {sortConfig.secondary === "priority" && <span className="text-cyan-400 text-xs">2</span>}
              </div>
              <div className="flex items-center gap-2 py-2 px-4 w-48"><Tag className="w-3.5 h-3.5" /><span>Tags</span></div>
              <div className="py-2.5 px-4 w-16"></div>
            </div>
            <div>{sortedTasks.map((task) => renderTaskRow(task))}</div>
          </div>
        </div>
      </div>
    </>
  );
}