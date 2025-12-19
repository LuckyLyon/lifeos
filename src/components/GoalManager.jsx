import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Zap, BatteryCharging, Clock, Save, X, Bot, ChevronDown, ChevronUp, History, Calendar, Star, TrendingUp } from 'lucide-react';

const GoalManager = ({ onBack }) => {
  const [goals, setGoals] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [addMode, setAddMode] = useState('manual'); 
  const [expandedId, setExpandedId] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [green, setGreen] = useState('');
  const [blue, setBlue] = useState('');
  const [time, setTime] = useState('09:00');
  
  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadGoals = () => {
      try {
        const saved = localStorage.getItem('lifeos-goals');
        if (saved) setGoals(JSON.parse(saved));
      } catch (e) {}
    };
    loadGoals();
  }, []);

  const saveToStorage = (updatedGoals) => {
    setGoals(updatedGoals);
    localStorage.setItem('lifeos-goals', JSON.stringify(updatedGoals));
  };

  const handleAIGenerate = () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    setTimeout(() => {
      let aiGreen = `专注执行: ${aiPrompt} (45分钟)`;
      let aiBlue = `保持手感: ${aiPrompt} (5分钟)`;
      let aiMilestones = ["Day 1-2: 启动期", "Day 3-5: 核心突破", "Day 6-7: 复盘进阶"];

      if (aiPrompt.includes("减肥") || aiPrompt.includes("运动")) {
        aiGreen = "高强度有氧/力量训练 (40分钟)";
        aiBlue = "拉伸或散步 (10分钟)";
      } else if (aiPrompt.includes("书") || aiPrompt.includes("读")) {
        aiGreen = "深度阅读并做笔记 (1章)";
        aiBlue = "随意翻看或读一段 (1页)";
      } else if (aiPrompt.includes("代码") || aiPrompt.includes("Python")) {
        aiGreen = "编写完整Demo (1小时)";
        aiBlue = "看教程或复习 (15分钟)";
      }

      setTitle(aiPrompt); setGreen(aiGreen); setBlue(aiBlue);
      window.tempAiData = { isAi: true, milestones: aiMilestones };
      setIsGenerating(false); setAddMode('manual');
    }, 1500);
  };

  const handleSave = () => {
    if (!title || !green || !blue) return;
    const newGoal = {
      id: Date.now(),
      title, green, blue, time,
      milestones: window.tempAiData?.milestones || [],
      streak: 0,
      history: [] 
    };
    const updated = [...goals, newGoal];
    saveToStorage(updated);
    setIsAdding(false); resetForm();
  };

  const resetForm = () => {
    setTitle(''); setGreen(''); setBlue(''); setTime('09:00');
    setAiPrompt(''); setAddMode('manual'); window.tempAiData = null;
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (confirm("确定删除?")) saveToStorage(goals.filter(g => g.id !== id));
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // --- 辅助函数：生成最近 14 天的日期数组 ---
  const getLast14Days = () => {
    const dates = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
    return dates;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fadeIn font-sans select-none">
      <div className="flex items-center justify-between p-6 bg-white shadow-sm shrink-0 z-10">
        <button onClick={onBack} className="flex items-center text-slate-600 hover:text-green-600 font-bold transition-colors">
          <ArrowLeft size={20} className="mr-2" /> 主页
        </button>
        <h2 className="text-xl font-black text-slate-800">目标指挥部</h2>
        <div className="w-16"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {goals.length === 0 && !isAdding && (
          <div className="text-center py-20 opacity-50 space-y-4">
            <TrendingUp size={48} className="mx-auto text-slate-300"/>
            <p className="text-slate-400 font-bold">还没有目标，建立第一个里程碑吧！</p>
          </div>
        )}

        {goals.map(goal => {
          const isExpanded = expandedId === goal.id;
          const history = goal.history || [];
          const totalCheckins = history.length;
          const last14Days = getLast14Days();
          
          return (
            <div 
              key={goal.id} 
              onClick={() => toggleExpand(goal.id)}
              className={`bg-white rounded-3xl shadow-sm border border-slate-100 relative group overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-md ${isExpanded ? 'ring-2 ring-slate-800' : ''}`}
            >
              {/* 卡片头部 */}
              <div className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                      <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        {goal.title}
                        {goal.milestones?.length > 0 && <Bot size={16} className="text-purple-500" />}
                      </h3>
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                          <span className="flex items-center gap-1"><Clock size={12}/> {goal.time}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span className="text-amber-500 flex items-center gap-1"><Zap size={12}/> {goal.streak || 0} 连胜</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span className="text-blue-500 flex items-center gap-1"><History size={12}/> {totalCheckins} 次打卡</span>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => handleDelete(e, goal.id)} className="text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"><Trash2 size={18} /></button>
                    <div className="text-slate-300">
                      {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-green-50/80 border border-green-100 flex items-center gap-3">
                    <div className="text-[10px] font-bold text-green-600 uppercase shrink-0">Green</div>
                    <div className="text-sm font-bold text-slate-700 truncate">{goal.green}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center gap-3">
                    <div className="text-[10px] font-bold text-blue-500 uppercase shrink-0">Blue</div>
                    <div className="text-sm font-bold text-slate-700 truncate">{goal.blue}</div>
                  </div>
                </div>
              </div>

              {/* --- 展开区域 --- */}
              {isExpanded && (
                <div className="bg-slate-50 border-t border-slate-100 p-6 animate-slideDown">
                   
                   {/* 1. 可视化：最近14天能量条 (Heatmap) */}
                   <div className="mb-6">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <TrendingUp size={14}/> 最近状态 (14天)
                      </h4>
                      <div className="flex gap-1.5 justify-between">
                          {last14Days.map(date => {
                             const record = history.find(h => h.date === date);
                             let bgClass = "bg-slate-200"; // 默认没打卡
                             if (record) {
                                bgClass = record.energy_mode === 'blue' ? 'bg-blue-400' : 'bg-green-500';
                             }
                             // 今天的日期高亮一下边框
                             const isToday = date === new Date().toISOString().split('T')[0];

                             return (
                               <div key={date} className="flex flex-col items-center gap-1 w-full">
                                  <div 
                                    className={`w-full aspect-square rounded-md ${bgClass} transition-all ${isToday ? 'ring-2 ring-slate-800 ring-offset-2' : ''}`}
                                    title={`${date}: ${record ? (record.energy_mode + ' mode') : 'Missed'}`}
                                  ></div>
                               </div>
                             )
                          })}
                      </div>
                   </div>

                   {/* 2. 详细列表：限制高度+滚动 (Scrollable List) */}
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                     <History size={14}/> 详细复盘
                   </h4>
                   
                   {history.length === 0 ? (
                     <div className="text-center py-4 text-slate-400 text-sm">暂无打卡记录</div>
                   ) : (
                     <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                       {[...history].reverse().map((record, idx) => (
                         <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                               <div className="flex items-center gap-2">
                                  <div className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1">
                                    <Calendar size={12}/> {record.date}
                                  </div>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${record.energy_mode === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                    {record.energy_mode === 'blue' ? 'Recovery' : 'Growth'}
                                  </span>
                               </div>
                               <div className="flex gap-0.5">
                                 {[...Array(record.rating || 5)].map((_, i) => <Star key={i} size={10} className="fill-amber-400 text-amber-400"/>)}
                               </div>
                            </div>
                            {record.review && (
                              <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg italic border-l-2 border-slate-300">
                                "{record.review}"
                              </div>
                            )}
                         </div>
                       ))}
                     </div>
                   )}
                   
                   {/* AI 里程碑 */}
                   {goal.milestones?.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-slate-200/50">
                        <div className="flex items-center gap-2 text-xs font-bold text-purple-600 mb-3 uppercase tracking-wider">
                          <Bot size={12}/> 当前 AI 规划路径
                        </div>
                        <div className="space-y-2">
                          {goal.milestones.map((m, i) => (
                            <div key={i} className="flex items-center gap-3 text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                              <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-purple-500 animate-pulse' : 'bg-slate-300'}`}></div>
                              {m}
                            </div>
                          ))}
                        </div>
                      </div>
                   )}
                </div>
              )}
            </div>
          );
        })}

        {isAdding && (
          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-slate-800 animate-slideUp">
             <div className="flex justify-between items-center mb-6">
                 <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setAddMode('manual')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${addMode === 'manual' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>手动录入</button>
                    <button onClick={() => setAddMode('ai')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${addMode === 'ai' ? 'bg-purple-100 text-purple-700 shadow-sm' : 'text-slate-400'}`}><Bot size={14}/> AI 规划</button>
                 </div>
                 <button onClick={() => { setIsAdding(false); resetForm(); }}><X size={24} className="text-slate-400 hover:text-slate-800"/></button>
             </div>
             {addMode === 'ai' ? (
               <div className="space-y-6 py-4">
                  <div className="text-center space-y-2"><div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-2"><Bot size={28}/></div><h3 className="text-lg font-bold text-slate-800">告诉我你想做什么?</h3><p className="text-xs text-slate-400">AI 会自动为你生成蓝绿双态目标和7天路径。</p></div>
                  <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="例如: 3个月内减重10斤 / 学习Python爬虫..." className="w-full p-4 bg-slate-50 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-purple-200 outline-none transition-all" autoFocus />
                  <button onClick={handleAIGenerate} disabled={isGenerating || !aiPrompt} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed">{isGenerating ? <span className="animate-pulse">AI 正在思考策略...</span> : <><Zap size={18}/> 生成方案</>}</button>
               </div>
             ) : (
               <div className="space-y-4">
                  <div className="flex gap-3"><div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">目标名称</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="如: 练出腹肌" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-slate-200 transition-all"/></div><div className="w-1/3"><label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">每日时间</label><input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-slate-200 transition-all"/></div></div>
                  <div className="space-y-3"><div className="relative"><div className="absolute top-3 left-3 text-green-600"><Zap size={18}/></div><input value={green} onChange={e => setGreen(e.target.value)} placeholder="高能量: 完美状态下做什么?" className="w-full pl-10 p-3 bg-green-50 border border-green-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-green-200 transition-all"/></div><div className="relative"><div className="absolute top-3 left-3 text-blue-500"><BatteryCharging size={18}/></div><input value={blue} onChange={e => setBlue(e.target.value)} placeholder="低能量: 累的时候做什么?" className="w-full pl-10 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-200 transition-all"/></div></div>
                  <button onClick={handleSave} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition-all shadow-lg"><Save size={18} /> 确认并保存</button>
               </div>
             )}
          </div>
        )}
      </div>

      {!isAdding && (
        <div className="p-6 pt-0 bg-transparent flex justify-center">
             <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-8 py-4 bg-slate-800 text-white rounded-full font-bold shadow-2xl hover:scale-105 active:scale-95 transition-transform hover:shadow-purple-500/20"><Plus size={20} /> 新建目标</button>
        </div>
      )}
    </div>
  );
};

export default GoalManager;