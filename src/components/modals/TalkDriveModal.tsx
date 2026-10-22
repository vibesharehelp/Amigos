import React, { useState } from 'react';
import { kakaoAudio } from '../../utils/kakaoAudio';
import {
  X,
  FolderArchive,
  HardDrive,
  Upload,
  CheckCircle2,
  FileText,
  Image,
  Music,
  Shield,
  RefreshCw,
  Download,
} from 'lucide-react';

interface TalkDriveModalProps {
  onClose: () => void;
}

export const TalkDriveModal: React.FC<TalkDriveModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'media' | 'files' | 'backup'>('media');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState('Today at 02:40 AM');

  const files = [
    {
      id: 'f1',
      name: 'Han_River_Picnic_Photos.zip',
      size: '28.4 MB',
      date: 'Yesterday',
      type: 'image',
    },
    {
      id: 'f2',
      name: 'Amigos_Pay_Tax_Receipts.pdf',
      size: '1.2 MB',
      date: 'Oct 02',
      type: 'doc',
    },
    {
      id: 'f3',
      name: 'Voice_Note_Choonsik_Birthday.m4a',
      size: '340 KB',
      date: 'Today',
      type: 'audio',
    },
  ];

  const handleStartBackup = () => {
    kakaoAudio.playTap();
    setIsBackingUp(true);
    setTimeout(() => {
      kakaoAudio.playPayChime();
      setIsBackingUp(false);
      setLastBackupDate('Just now');
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200 max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
              <FolderArchive className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#191919]">Amigos Talk Drive</h2>
              <span className="text-[10px] text-slate-400 block -mt-0.5">
                Safe cloud storage for chat files & memories
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
          {/* Storage Meter Gauge */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">Cloud Storage Used</span>
              <span className="text-xs font-black text-[#191919]">1.8 GB / 15.0 GB</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full w-[12%]" />
            </div>
            <span className="text-[10px] text-slate-400 mt-1.5 block">
              13.2 GB available • End-to-end encrypted backup
            </span>
          </div>

          {/* Backup Action Banner */}
          <div className="p-4 bg-sky-50/60 border border-sky-200 rounded-2xl flex items-center justify-between">
            <div>
              <h4 className="text-xs font-extrabold text-[#191919]">Chat History Backup</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Last backup: {lastBackupDate}</p>
            </div>
            <button
              onClick={handleStartBackup}
              disabled={isBackingUp}
              className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1 transition active:scale-95 shadow-xs"
            >
              {isBackingUp ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Backing up...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Backup Now</span>
                </>
              )}
            </button>
          </div>

          {/* Stored Files */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Recent Shared Files & Media
            </span>

            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-sky-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      {file.type === 'image' ? (
                        <Image className="w-4 h-4 text-amber-600" />
                      ) : file.type === 'audio' ? (
                        <Music className="w-4 h-4 text-purple-600" />
                      ) : (
                        <FileText className="w-4 h-4 text-sky-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#191919] truncate max-w-[170px]">
                        {file.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {file.size} • {file.date}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      kakaoAudio.playTap();
                      alert(`Downloading ${file.name}`);
                    }}
                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
