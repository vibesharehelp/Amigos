import React, { useState, useEffect } from 'react';
import { kakaoAudio } from '../../utils/kakaoAudio';
import {
  X,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Cake,
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
  Bell,
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'birthday' | 'dday' | 'meeting' | 'party';
  reminder: boolean;
}

interface AmigosCalendarModalProps {
  onClose: () => void;
}

export const AmigosCalendarModal: React.FC<AmigosCalendarModalProps> = ({ onClose }) => {
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('amigos_calendar_events');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        id: 'ev_1',
        title: "Choonsik's Birthday Party 🍠🎉",
        date: 'Today',
        type: 'birthday',
        reminder: true,
      },
      {
        id: 'ev_2',
        title: 'Han River Weekend Picnic with Ryan 🍗',
        date: 'This Saturday, 2:00 PM',
        type: 'party',
        reminder: true,
      },
      {
        id: 'ev_3',
        title: 'Project Launch D-Day 🚀',
        date: 'Oct 15',
        type: 'dday',
        reminder: false,
      },
    ];
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('Tomorrow, 3:00 PM');
  const [newType, setNewType] = useState<'birthday' | 'dday' | 'meeting' | 'party'>('meeting');

  const saveEvents = (updated: CalendarEvent[]) => {
    setEvents(updated);
    localStorage.setItem('amigos_calendar_events', JSON.stringify(updated));
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    kakaoAudio.playKaTalkChime();
    const created: CalendarEvent = {
      id: `ev_${Date.now()}`,
      title: newTitle.trim(),
      date: newDate.trim(),
      type: newType,
      reminder: true,
    };
    saveEvents([created, ...events]);
    setNewTitle('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200 max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-0.5 shadow-2xs">
              <img src="/logo.png" alt="Amigos Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#191919]">Amigos Calendar</h2>
              <span className="text-[10px] text-slate-400 block -mt-0.5">
                Chat schedules, D-Days & birthdays
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              kakaoAudio.playTap();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Calendar Month Header */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-[#191919]">October 2026</h3>
              <span className="text-[10px] text-purple-600 font-bold bg-purple-100 px-2 py-0.5 rounded-full">
                Autumn Season 🍁
              </span>
            </div>

            <button
              onClick={() => {
                kakaoAudio.playTap();
                setShowAddForm(!showAddForm);
              }}
              className="px-2.5 py-1 rounded-xl bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-bold text-xs flex items-center gap-1 shadow-2xs active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Event</span>
            </button>
          </div>

          {/* Add Event Form */}
          {showAddForm && (
            <form onSubmit={handleAddEvent} className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-2.5 animate-in slide-in-from-top-2">
              <h4 className="text-xs font-extrabold text-[#191919]">Create New Schedule</h4>
              <input
                type="text"
                placeholder="Event title (e.g. Birthday dinner, meeting)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-[#191919] focus:outline-none focus:border-amber-400"
                autoFocus
              />
              <input
                type="text"
                placeholder="Date / Time (e.g. Friday, 7:00 PM)"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-[#191919] focus:outline-none"
              />

              <div className="flex gap-1.5">
                {(['meeting', 'birthday', 'party', 'dday'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewType(t)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold capitalize transition ${
                      newType === t ? 'bg-[#191919] text-white' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-bold text-xs shadow-xs"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          )}

          {/* Events List */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Upcoming Schedules ({events.length})
            </span>

            {events.map((ev) => (
              <div
                key={ev.id}
                className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-purple-200 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${
                      ev.type === 'birthday'
                        ? 'bg-rose-100 text-rose-600'
                        : ev.type === 'party'
                        ? 'bg-amber-100 text-amber-700'
                        : ev.type === 'dday'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {ev.type === 'birthday' ? '🎂' : ev.type === 'party' ? '🎉' : ev.type === 'dday' ? '🚀' : '📅'}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[#191919] leading-tight">{ev.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{ev.date}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Reminder Active" />
                  <Bell className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
