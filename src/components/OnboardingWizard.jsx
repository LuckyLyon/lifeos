import React, { useState } from 'react';
import { Sparkles, ArrowRight, Flag, Zap, BatteryCharging, Clock, CalendarDays, CheckCircle2 } from 'lucide-react';

const OnboardingWizard = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  
  // Step 2: Energy Profile State
  // 0=Sunday, 1=Monday... 6=Saturday. 默认全绿，点击切换
  const [weekProfile, setWeekProfile] = useState({
    1: 'green', 2: 'green', 3: 'green', 4: 'green', 5: 'green', // Mon-Fri
    6: 'green', 0: 'green' // Sat-Sun
  });

  // Step 3: Goal State
  const [category, setCategory] = useState('');
  const [greenHabit, setGreenHabit] = useState('');
  const [blueHabit, setBlueHabit] = useState('');
  const [preferredTime, setPreferredTime] = useState('09:00');

  // --- 逻辑处理 ---
  const toggleDay = (dayIndex) => {
    setWeekProfile(prev => ({
      ...prev,
      [dayIndex]: prev[dayIndex] === 'green' ? 'blue' : 'green'
    }));
  };

  const fillExample = () => {
    setCategory('身体健康');
    setGreenHabit('健身房锻炼 45分钟');
    setBlueHabit('做 10 个俯卧撑');
    setPreferredTime('18:00');
  };

  const handleFinish = () => {
    if (!greenHabit || !blueHabit) {
      alert("请填写完整的高能量和低能量目标。");
      return;
    }

    // 1. 保存能量画像 (Energy Profile)
    localStorage.setItem('lifeos-energy-profile', JSON.stringify(weekProfile));

    // 2. 保存首个目标
    const newGoal = {
      id: Date.now(),
      title: category || '默认习惯',
      green: greenHabit,
      blue: blueHabit,
      time: preferredTime,
      frequency: 'daily', // 默认为每天，之后可在库里改
      milestones: [],
      streak: 0,
      history: []
    };

    let finalGoals = [];
    try {
        const existingStr = localStorage.getItem('lifeos-goals');
        if (existingStr && existingStr !== "undefined") finalGoals = JSON.parse(existingStr);
    } catch (e) { finalGoals = []; }
    finalGoals.push(newGoal);
    localStorage.setItem('lifeos-goals', JSON.stringify(finalGoals));

    // 3. 生成今日计划 (基于刚才设置的 Profile 判断今日颜色)
    const today = new Date();
    const dayIndex = today.getDay();
    const todayMode = weekProfile[dayIndex]; // 获取今日设定的模式
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const firstTask = {
      id: Date.now(),
      time: preferredTime, 
      text: todayMode === 'blue' ? blueHabit : greenHabit, // 根据模式选任务
      done: false,
      duration: todayMode === 'blue' ? 15 : 60,
      type: todayMode, // 颜色跟随 Profile
      source: 'habit'
    };

    localStorage.setItem(`lifeos-tasks-day-${dateStr}`, JSON.stringify([firstTask]));
    localStorage.setItem(`lifeos-daily-status-${dateStr}`, todayMode);
    localStorage.setItem('lifeos-last-checkin', dateStr);

    setTimeout(() => { onComplete(); }, 100);
  };

  const weekDays = [
    { id: 1, label: '周一' }, { id: 2, label: '周二' }, { id: 3, label: '周三' },
    { id: 4, label: '周四' }, { id: 5, label: '周五' }, { id: 6, label: '周六' }, { id: 0, label: '周日' }
  ];

  return (
    <div className="fixed inset-0 bg-slate-50 z-[100] flex flex-col items-center justify-center p-6 animate-fadeIn font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        
        {/* 进度条 (3步) */}
        <div className="h-1.5 bg-slate-100 w-full">
          <div className="h-full bg-slate-800 transition-all duration-500" style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}></div>
        </div>

        <div className="p-8">
          {/* STEP 1: 欢迎 */}
          {step === 1 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm"><Flag size={32} /></div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">欢迎来到 LifeOS</h1>
              <p className="text-slate-500 leading-relaxed text-sm">
                能量有高低起伏，计划也应随之而动。<br/>让我们打造一个既能在<strong>巅峰日</strong>助你冲刺，<br/>也能在<strong>低谷日</strong>为你托底的系统。
              </p>
              <button onClick={() => setStep(2)} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors shadow-lg">开始设置 <ArrowRight size={18} /></button>
            </div>
          )}

          {/* STEP 2: 能量周期 (NEW) */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800">你的能量节奏?</h2>
                <p className="text-xs text-slate-400 mt-1">点选你通常感到疲惫(蓝)或精力充沛(绿)的日子。</p>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {weekDays.map(d => (
                  <button 
                    key={d.id}
                    onClick={() => toggleDay(d.id)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                      weekProfile[d.id] === 'green' 
                        ? 'bg-green-50 border-2 border-green-200 text-green-700' 
                        : 'bg-blue-50 border-2 border-blue-200 text-blue-600'
                    }`}
                  >
                    <span className="text-xs font-bold">{d.label}</span>
                    {weekProfile[d.id] === 'green' ? <Zap size={16} className="fill-green-200"/> : <BatteryCharging size={16}/>}
                  </button>
                ))}
              </div>

              <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 flex gap-2">
                 <Sparkles size={16} className="shrink-0 text-amber-400"/>
                 <span>系统会记住这个节奏，在每日签到时为你自动预判能量状态。</span>
              </div>

              <button onClick={() => setStep(3)} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors shadow-lg">下一步 <ArrowRight size={18} /></button>
            </div>
          )}

          {/* STEP 3: 设定首个目标 */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800">设定核心习惯</h2>
                <p className="text-xs text-slate-400 mt-1">为同一个目标，设定两种难度的执行方案。</p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">类别</label>
                        <input value={category} onChange={e => setCategory(e.target.value)} placeholder="如: 运动" className="w-full p-2 bg-slate-50 rounded-xl font-bold text-slate-700"/>
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">计划时间</label>
                        <div className="relative">
                            <input type="time" value={preferredTime} onChange={e => setPreferredTime(e.target.value)} className="w-full p-2 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none"/>
                            <Clock size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none"/>
                        </div>
                    </div>
                </div>
                
                <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-2 text-green-700 mb-1 font-bold text-xs"><Zap size={14} /> 高能量 (绿)</div>
                  <input value={greenHabit} onChange={e => setGreenHabit(e.target.value)} placeholder="例如: 跑步 5公里" className="w-full bg-white p-2 rounded-lg text-sm outline-none border border-transparent focus:border-green-300"/>
                </div>

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-700 mb-1 font-bold text-xs"><BatteryCharging size={14} /> 低能量 (蓝)</div>
                  <input value={blueHabit} onChange={e => setBlueHabit(e.target.value)} placeholder="例如: 散步 5分钟" className="w-full bg-white p-2 rounded-lg text-sm outline-none border border-transparent focus:border-blue-300"/>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button onClick={handleFinish} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors shadow-lg">完成设置并进入</button>
                <button onClick={fillExample} className="text-xs text-slate-400 font-medium hover:text-slate-600 flex items-center justify-center gap-1"><Sparkles size={12}/> 自动填充示例</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default OnboardingWizard;