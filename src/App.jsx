import React, { useState, useEffect } from 'react';
import CalendarStrip from './components/CalendarStrip';
import DailyTimeline from './components/DailyTimeline';
import EnergySetup from './components/EnergySetup';
import ModeToggle from './components/ModeToggle';
import AIPlanner from './components/AIPlanner';
import GoalManager from './components/GoalManager'; 
import EnergyCheckin from './components/EnergyCheckin'; 
import OnboardingWizard from './components/OnboardingWizard';
import { Settings, Sparkles, BookOpen, Sun, Calendar as CalendarIcon, Bell } from 'lucide-react';

function App() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEnergySetup, setShowEnergySetup] = useState(false);
  const [showAIPlanner, setShowAIPlanner] = useState(false);
  const [showGoalManager, setShowGoalManager] = useState(false);
  const [showEnergyCheckin, setShowEnergyCheckin] = useState(false);
  const [currentMode, setCurrentMode] = useState('green');
  const [showOnboarding, setShowOnboarding] = useState(false);

  // 获取今日日期字符串
  const getTodayString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // 同步 UI 颜色模式
  const syncModeWithDate = (date) => {
    if (!date) return;
    const status = localStorage.getItem(`lifeos-daily-status-${date}`);
    if (status) setCurrentMode(status);
    else setCurrentMode('green'); 
  };

  // --- 核心：智能合并 ---
  const handleEnergyPlanGenerated = (newHabitTasks, mode) => {
    if (!newHabitTasks) return;
    const today = getTodayString();
    const targetDate = selectedDate || today; 
    const storageKey = `lifeos-tasks-day-${targetDate}`;

    let existingTasks = [];
    try {
        const saved = localStorage.getItem(storageKey);
        if (saved) existingTasks = JSON.parse(saved);
    } catch (e) {}

    const manualTasks = existingTasks
        .filter(t => t.source === 'manual' || !t.source)
        .map(t => ({ ...t, type: mode }));

    const finalTasks = [...manualTasks, ...newHabitTasks];

    finalTasks.sort((a, b) => {
        const getMin = (tStr) => {
            if (!tStr) return 0;
            const [h, m] = tStr.split(':').map(Number);
            return h * 60 + m;
        };
        return getMin(a.time) - getMin(b.time);
    });

    localStorage.setItem(storageKey, JSON.stringify(finalTasks));
    localStorage.setItem(`lifeos-daily-status-${targetDate}`, mode);
    localStorage.setItem('lifeos-last-checkin', today);
    
    setCurrentMode(mode);
    if (!selectedDate) setSelectedDate(today); 
    setShowEnergyCheckin(false);
  };

  // --- 日历导出引擎 ---
  const handleExportCalendar = () => {
    if (!window.confirm("要在手机日历中添加未来 7 天的提醒吗？\n(未生成的日期将默认按'绿日'目标生成)")) return;
    const goalsStr = localStorage.getItem('lifeos-goals');
    const goals = goalsStr ? JSON.parse(goalsStr) : [];
    
    if (goals.length === 0) {
      alert("还没有目标，无法生成日历。请先去 Habit Library 添加目标。");
      return;
    }

    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LifeOS//V9.3//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";
    const today = new Date();

    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        let dayTasks = [];
        const savedTasks = localStorage.getItem(`lifeos-tasks-day-${dateStr}`);
        if (savedTasks) {
            dayTasks = JSON.parse(savedTasks);
        } else {
            dayTasks = goals.map((g, idx) => {
                let tStr = g.time;
                if (!tStr) { const h = 9 + idx; tStr = `${h < 10 ? '0'+h : h}:00`; }
                return { text: g.green, time: tStr, duration: 60 };
            });
        }

        dayTasks.forEach(task => {
            if (!task.time) return;
            const [th, tm] = task.time.split(':').map(Number);
            const startDate = new Date(d);
            startDate.setHours(th, tm, 0);
            const endDate = new Date(startDate);
            endDate.setMinutes(startDate.getMinutes() + (task.duration || 60));
            const formatICSDate = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            icsContent += "BEGIN:VEVENT\nSUMMARY:LifeOS: ${task.text}\nDTSTART:${formatICSDate(startDate)}\nDTEND:${formatICSDate(endDate)}\nDESCRIPTION:来自 LifeOS 的能量计划\nSTATUS:CONFIRMED\nEND:VEVENT\n";
        });
    }
    icsContent += "END:VCALENDAR";
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'lifeos_plan.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 🔔 V9.4 新增：浏览器通知权限请求 ---
  const handleRequestNotification = () => {
    if (!("Notification" in window)) {
      alert("你的浏览器不支持通知功能");
      return;
    }

    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification("LifeOS 通知已开启", {
          body: "以后当你在使用电脑时，LifeOS 会在桌面提醒你该休息或行动了！",
          icon: "/vite.svg"
        });
      } else {
        alert("请在浏览器设置中允许通知权限。");
      }
    });
  };

  // --- 初始化 ---
  useEffect(() => {
    const today = getTodayString();
    const savedGoals = localStorage.getItem('lifeos-goals');
    if (!savedGoals || savedGoals === '[]') {
        setShowOnboarding(true);
        return; 
    }
    const lastCheckin = localStorage.getItem('lifeos-last-checkin');
    if (lastCheckin !== today) {
      setShowEnergyCheckin(true);
    }
  }, []);

  const handleDateSelect = (date) => {
    syncModeWithDate(date);
    setSelectedDate(date);
    setShowGoalManager(false);
  };
  const handleBack = () => { setSelectedDate(null); setShowGoalManager(false); setShowEnergyCheckin(false); setCurrentMode('green'); };
  const handleOnboardingComplete = () => { setShowOnboarding(false); const today = getTodayString(); setSelectedDate(today); setCurrentMode('green'); };

  if (showOnboarding) return <OnboardingWizard onComplete={handleOnboardingComplete} />;

  let content;
  if (showGoalManager) {
    content = <GoalManager onBack={handleBack} />;
  } else if (selectedDate) {
    content = <DailyTimeline date={selectedDate} onBack={handleBack} />;
  } else {
    content = (
      <div className="flex flex-col items-center justify-center h-full space-y-10 animate-fadeIn p-6">
        <div className="w-full"><CalendarStrip onSelectDate={handleDateSelect} /></div>
        <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
           <button onClick={() => setShowGoalManager(true)} className="flex items-center justify-center gap-3 px-6 py-4 bg-white text-slate-700 rounded-2xl shadow-sm border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all font-bold text-lg group">
             <div className="p-2 bg-blue-50 text-blue-500 rounded-lg group-hover:scale-110 transition-transform"><BookOpen size={24} /></div><span>Habit Library</span>
           </button>
        </div>
        <p className="text-slate-400 text-sm font-medium">Select a date or check your energy.</p>
      </div>
    );
  }

  const themeClass = currentMode === 'blue' ? 'bg-blue-50' : 'bg-green-50';

  return (
    <div className={`h-screen w-full flex justify-center overflow-hidden transition-colors duration-500 ${themeClass}`}>
      <div className={`w-full max-w-md md:max-w-3xl h-full shadow-2xl relative flex flex-col transition-colors duration-500 ${themeClass}`}>
        {!selectedDate && !showGoalManager && (
          <div className="pt-10 pb-4 px-8 flex items-center justify-between shrink-0">
            <div><h1 className="text-2xl font-black text-slate-800 tracking-tight">LIFE REBOOT</h1><p className="text-xs text-slate-400 font-bold tracking-widest uppercase">System V9.4</p></div>
            <div className="flex items-center gap-2">
              <ModeToggle mode={currentMode} />
              
              {/* 🔔 通知开关 */}
              <button onClick={handleRequestNotification} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl shadow-sm hover:bg-rose-100 transition-colors" title="开启桌面通知">
                <Bell size={20} />
              </button>

              <button onClick={handleExportCalendar} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm hover:bg-indigo-100 transition-colors" title="同步到手机日历">
                <CalendarIcon size={20} />
              </button>

              <button onClick={() => setShowEnergyCheckin(true)} className="p-2.5 bg-amber-100 text-amber-600 rounded-xl shadow-sm hover:bg-amber-200 transition-colors"><Sun size={20} /></button>
              <button onClick={() => setShowAIPlanner(true)} className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 hover:text-purple-500 transition-colors"><Sparkles size={20} /></button>
            </div>
          </div>
        )}
        
        {selectedDate && (
            <div className="absolute top-4 right-4 z-50 flex gap-2 animate-fadeIn">
                 <button onClick={() => setShowEnergyCheckin(true)} className="p-2 bg-white/80 backdrop-blur rounded-full shadow-lg text-amber-500 hover:scale-110 transition-transform"><Sun size={20} /></button>
            </div>
        )}

        <div className="flex-1 overflow-hidden relative">{content}</div>
        
        {showEnergyCheckin && <EnergyCheckin onGenerate={handleEnergyPlanGenerated} onClose={() => setShowEnergyCheckin(false)} />}
        {showEnergySetup && <EnergySetup onClose={() => setShowEnergySetup(false)} />}
        {showAIPlanner && <AIPlanner onClose={() => setShowAIPlanner(false)} />}
      </div>
    </div>
  );
}

export default App;