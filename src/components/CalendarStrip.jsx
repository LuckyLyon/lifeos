import React, { useState, useEffect } from 'react'; 
 import { ChevronLeft, ChevronRight } from 'lucide-react'; 
 
 const CalendarStrip = ({ onSelectDate }) => { 
   const [currentDate, setCurrentDate] = useState(new Date()); 
   const [coloredDays, setColoredDays] = useState({}); 
 
   const getDaysInMonth = (date) => { 
     const year = date.getFullYear(); 
     const month = date.getMonth(); 
     const days = new Date(year, month + 1, 0).getDate(); 
     return Array.from({ length: days }, (_, i) => i + 1); 
   }; 
 
   const days = getDaysInMonth(currentDate); 
   const year = currentDate.getFullYear(); 
   const month = currentDate.getMonth(); 
 
   // --- 🎨 PAINT LOGIC: Read Status Directly --- 
   useEffect(() => { 
     const scanDays = () => { 
       const newColors = {}; 
       days.forEach(day => { 
         const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; 
         // The new logic: Read explicit status 
         const status = localStorage.getItem(`lifeos-daily-status-${dateStr}`); 
         if (status) { 
           newColors[day] = status; // 'blue' or 'green' 
         } 
       }); 
       setColoredDays(newColors); 
     }; 
     
     scanDays(); 
     const interval = setInterval(scanDays, 1000); // Fast refresh 
     return () => clearInterval(interval); 
   }, [currentDate, month, year, days]); 
 
   const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1)); 
   const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1)); 
   const handleDayClick = (day) => { 
     const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; 
     onSelectDate(dateStr); 
   }; 
 
   const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]; 
 
   return ( 
     <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 w-full animate-fadeIn"> 
       <div className="flex justify-between items-center mb-6"> 
         <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><ChevronLeft size={20} /></button> 
         <h2 className="text-lg font-black text-slate-700 tracking-widest uppercase">{year}年 {monthNames[month]}</h2> 
         <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><ChevronRight size={20} /></button> 
       </div> 
 
       <div className="grid grid-cols-7 gap-2 text-center mb-2"> 
         {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => ( 
           <div key={d} className="text-[10px] font-bold text-slate-300 tracking-widest">{d}</div> 
         ))} 
       </div> 
       
       <div className="grid grid-cols-7 gap-2"> 
         {Array.from({ length: new Date(year, month, 1).getDay() }).map((_, i) => <div key={`empty-${i}`}></div>)} 
 
         {days.map(day => { 
           const colorType = coloredDays[day]; 
           let bgClass = 'bg-slate-50 text-slate-700 hover:bg-slate-100'; 
           
           if (colorType === 'green') bgClass = 'bg-green-500 text-white shadow-lg shadow-green-200 hover:bg-green-600 scale-105 font-bold'; 
           if (colorType === 'blue') bgClass = 'bg-blue-500 text-white shadow-lg shadow-blue-200 hover:bg-blue-600 scale-105 font-bold'; 
 
           return ( 
             <button key={day} onClick={() => handleDayClick(day)} className={`aspect-square rounded-2xl flex items-center justify-center text-sm transition-all duration-300 ${bgClass}`}> 
               {day} 
             </button> 
           ); 
         })} 
       </div> 
     </div> 
   ); 
 }; 
 
 export default CalendarStrip;