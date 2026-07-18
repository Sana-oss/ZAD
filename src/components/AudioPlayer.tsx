import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Play, Pause, Square, X, Volume2, ChevronUp, ChevronDown, Repeat, Sparkles, Activity } from 'lucide-react';

export const AudioPlayer: React.FC = () => {
  const {
    playingAudio,
    setPlayingAudio,
    audioPlaying,
    setAudioPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    reciter,
    setReciter,
    settings,
    incrementDhikrCount
  } = useApp();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatProgress, setRepeatProgress] = useState(1);
  const [maxRepeats, setMaxRepeats] = useState(1);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isAr = settings.language === 'ar';

  // Extract Quran verse number/surah number or standard MP3 details if available
  useEffect(() => {
    if (!playingAudio) {
      stopAll();
      return;
    }

    // Determine max repeats from Dhikr count
    // Dhikr ids usually have details, let's extract repeat count
    // We can infer max repeats from the actual playingAudio metadata, if passed
    const id = playingAudio.id;
    let targetRepeats = 1;
    if (id.startsWith('m') || id.startsWith('e') || id.startsWith('s') || id.startsWith('p')) {
      // Find the dhikr in standard lists or default to 3/7 etc based on ID
      if (['m2', 'm4', 'm6', 'e2', 'e3', 's2', 's4'].includes(id)) targetRepeats = 3;
      if (['m3', 'e5'].includes(id)) targetRepeats = 7;
      if (['m7', 'e6'].includes(id)) targetRepeats = 100; // Let's cap auto-repeat at 10 for convenience or keep full count
    }
    // Cap auto-TTS repeat at 10 to avoid infinite loops, but user can click for more
    setMaxRepeats(targetRepeats > 10 ? 10 : targetRepeats);
    setRepeatProgress(1);

    // Initialize audio play
    playCurrent(playingAudio, 1, targetRepeats > 10 ? 10 : targetRepeats);

    return () => {
      stopAll();
    };
  }, [playingAudio]);

  // Sync playback speed to HTML5 Audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
    // For TTS, we need to restart or it applies on next utterance
    if (audioPlaying && ttsUtteranceRef.current && !playingAudio?.isQuran) {
      // Re-trigger with new speed
      const savedRepeat = repeatProgress;
      window.speechSynthesis.cancel();
      playTTS(playingAudio?.text || '', savedRepeat, maxRepeats);
    }
  }, [playbackSpeed]);

  // Handle Reciter change for Quran verses
  useEffect(() => {
    if (playingAudio && playingAudio.isQuran) {
      const currentPos = audioRef.current ? audioRef.current.currentTime : 0;
      const wasPlaying = audioPlaying;
      
      stopAll();
      
      // Re-construct Quran URL for the selected reciter
      const url = getQuranUrl(playingAudio.id, reciter);
      const updatedAudio = { ...playingAudio, audioUrl: url };
      
      setPlayingAudio(updatedAudio);
      
      // Wait for it to set, then play from current position if it was playing
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = currentPos;
          if (wasPlaying) {
            audioRef.current.play().catch(console.error);
            setAudioPlaying(true);
          }
        }
      }, 100);
    }
  }, [reciter]);

  const getQuranUrl = (id: string, rec: string) => {
    // Determine surah & verse
    let surah = 1;
    let verse = 1;
    
    if (id === 'p4') {
      // Ayah Al-Kursi
      surah = 2;
      verse = 255;
    } else if (id === 'm3' || id === 'e5') {
      // Hasbi Allah
      surah = 9;
      verse = 129;
    } else if (id === 's4') {
      // Surah Al-Ikhlas
      surah = 112;
      verse = 1;
    } else if (id.startsWith('quran_v_')) {
      // Custom format: quran_v_{surah}_{verse}
      const parts = id.split('_');
      surah = parseInt(parts[2]) || 1;
      verse = parseInt(parts[3]) || 1;
    }

    const pad3 = (num: number) => String(num).padStart(3, '0');
    let recPath = 'Alafasy_128kbps';
    if (rec === 'abdulbasit') recPath = 'Abdul_Basit_Murattal_192kbps';
    if (rec === 'husary') recPath = 'Husary_128kbps';

    return `https://everyayah.com/data/${recPath}/${pad3(surah)}${pad3(verse)}.mp3`;
  };

  const playCurrent = (audio: any, startRepeat: number, totalRepeats: number) => {
    stopAll();

    if (audio.isQuran || audio.audioUrl) {
      // Play via HTML5 Audio
      const url = audio.audioUrl || getQuranUrl(audio.id, reciter);
      const audioObj = new Audio(url);
      audioRef.current = audioObj;
      audioObj.playbackRate = playbackSpeed;
      audioObj.muted = isMuted;

      audioObj.addEventListener('timeupdate', () => {
        setCurrentTime(audioObj.currentTime);
      });

      audioObj.addEventListener('loadedmetadata', () => {
        setDuration(audioObj.duration);
      });

      audioObj.addEventListener('ended', () => {
        if (startRepeat < totalRepeats) {
          // Increment repeat count
          setRepeatProgress(startRepeat + 1);
          // Increment actual App count
          incrementDhikrCount(audio.id, 100);
          playCurrent(audio, startRepeat + 1, totalRepeats);
        } else {
          setAudioPlaying(false);
          incrementDhikrCount(audio.id, 100);
        }
      });

      audioObj.play()
        .then(() => setAudioPlaying(true))
        .catch((err) => {
          console.error('Audio playback failed, falling back to TTS', err);
          playTTS(audio.text, startRepeat, totalRepeats);
        });
    } else {
      // Play via Web Speech Synthesis (TTS)
      playTTS(audio.text, startRepeat, totalRepeats);
    }
  };

  const playTTS = (text: string, currentRep: number, totalRep: number) => {
    if (!('speechSynthesis' in window)) {
      alert(isAr ? 'متصفحك لا يدعم قراءة النصوص صوتياً.' : 'Text-to-speech is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel(); // clean up

    // Clean text from custom characters/parenthesis for smoother speaking
    const cleanText = text
      .replace(/\(\d+ مرة\)/g, '')
      .replace(/ثلاث مرات/g, '')
      .replace(/سبع مرات/g, '')
      .replace(/مائة مرة/g, '')
      .replace(/[()\-]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    ttsUtteranceRef.current = utterance;
    
    // Set Arabic language specifically
    utterance.lang = 'ar-SA';
    
    // Find beautiful premium Arabic voice if available
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }

    // Set tranquil parameters
    utterance.rate = playbackSpeed * 0.82; // Calming slow recitation
    utterance.pitch = 0.95;

    utterance.onstart = () => {
      setAudioPlaying(true);
    };

    utterance.onend = () => {
      if (currentRep < totalRep) {
        setRepeatProgress(currentRep + 1);
        incrementDhikrCount(playingAudio?.id || '', 100);
        // Play next repetition after 1 second of tranquil silence
        setTimeout(() => {
          if (playingAudio) {
            playTTS(text, currentRep + 1, totalRep);
          }
        }, 1000);
      } else {
        setAudioPlaying(false);
        incrementDhikrCount(playingAudio?.id || '', 100);
      }
    };

    utterance.onerror = (e) => {
      console.error('TTS speech error', e);
      setAudioPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopAll = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setAudioPlaying(false);
  };

  const handlePlayPause = () => {
    if (audioPlaying) {
      // Pause
      if (audioRef.current) {
        audioRef.current.pause();
        setAudioPlaying(false);
      } else if ('speechSynthesis' in window) {
        window.speechSynthesis.pause();
        setAudioPlaying(false);
      }
    } else {
      // Resume
      if (audioRef.current) {
        audioRef.current.play().then(() => setAudioPlaying(true));
      } else if ('speechSynthesis' in window) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setAudioPlaying(true);
        } else if (playingAudio) {
          playCurrent(playingAudio, repeatProgress, maxRepeats);
        }
      }
    }
  };

  const handleClose = () => {
    stopAll();
    setPlayingAudio(null);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const val = parseFloat(e.target.value);
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const formatTime = (timeInSecs: number) => {
    const mins = Math.floor(timeInSecs / 60);
    const secs = Math.floor(timeInSecs % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!playingAudio) return null;

  return (
    <div 
      className={`fixed bottom-16 md:bottom-6 left-4 right-4 md:left-auto md:right-6 z-40 transition-all duration-300 ease-in-out ${
        isMinimized ? 'h-16 md:w-80' : 'h-auto md:w-[400px]'
      }`}
      id="floating-audio-player"
    >
      <div className="w-full bg-surface border border-border-custom rounded-3xl p-4 shadow-xl flex flex-col gap-3 relative overflow-hidden transition-all duration-300">
        
        {/* Sage-Green Aesthetic Accent Overlay */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary/20 pointer-events-none" />

        {/* Minimalized View Bar */}
        {isMinimized ? (
          <div className="flex items-center justify-between w-full" id="player-minimized-view">
            <button 
              onClick={handleClose}
              className="p-1 rounded-full text-text-secondary hover:text-red-500 hover:bg-surface-muted transition-all"
              id="btn-player-close-min"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2" id="player-min-meta">
              <span className="arabic-text text-xs font-bold text-text-primary text-right truncate max-w-[150px]">
                {playingAudio.text}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/5 text-primary">
                <Activity className={`h-4 w-4 ${audioPlaying ? 'animate-pulse' : ''}`} />
              </div>
            </div>

            <button
              onClick={handlePlayPause}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover active-press shadow-sm"
              id="btn-play-pause-min"
            >
              {audioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
            </button>

            <button 
              onClick={() => setIsMinimized(false)}
              className="p-1 rounded-full text-text-secondary hover:text-primary hover:bg-surface-muted transition-all"
              id="btn-player-expand"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* Full View player */
          <div className="flex flex-col gap-3" id="player-full-view">
            
            {/* Player Header */}
            <div className="flex items-center justify-between border-b border-border-custom/50 pb-2.5" id="player-header">
              
              <div className="flex items-center gap-1" id="player-left-header">
                <button 
                  onClick={handleClose}
                  className="p-1.5 rounded-full text-text-secondary hover:text-red-500 hover:bg-surface-muted transition-all"
                  id="btn-player-close"
                  title={isAr ? 'إغلاق المشغل' : 'Close Player'}
                >
                  <X className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 rounded-full text-text-secondary hover:text-primary hover:bg-surface-muted transition-all"
                  id="btn-player-minimize"
                  title={isAr ? 'تصغير' : 'Minimize'}
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Serene spiritual label & reciter badge */}
              <div className="flex items-center gap-2 text-right" id="player-title-box">
                <span className="arabic-text text-[10px] font-bold bg-primary/5 text-primary rounded-full px-2.5 py-0.5">
                  {playingAudio.isQuran ? (isAr ? 'تلاوة قرآنية' : 'Quran Recitation') : (isAr ? 'تلاوة الأذكار' : 'Dhikr Playback')}
                </span>
                <h4 className="arabic-text text-xs font-bold text-text-primary">
                  {playingAudio.title}
                </h4>
              </div>

            </div>

            {/* Dhikr text viewer (Scrollable if long) */}
            <div className="bg-surface-muted/40 border border-border-custom/40 rounded-2xl p-3 max-h-24 overflow-y-auto text-right" id="player-text-viewer">
              <p className="arabic-text text-sm font-bold text-text-primary leading-relaxed">
                {playingAudio.text}
              </p>
            </div>

            {/* Quranic Reciter Selection / Controls */}
            {playingAudio.isQuran && (
              <div className="flex items-center justify-between bg-primary/5 rounded-xl p-2 border border-primary/10 text-xs" id="player-reciter-box">
                <select
                  value={reciter}
                  onChange={(e) => setReciter(e.target.value as any)}
                  className="arabic-text text-[11px] font-semibold bg-surface border border-border-custom rounded-lg px-2 py-1 text-right focus:outline-none focus:border-primary cursor-pointer"
                  id="select-reciter"
                >
                  <option value="alafasy">مشاري العفاسي</option>
                  <option value="abdulbasit">عبد الباسط عبد الصمد</option>
                  <option value="husary">محمود خليل الحصري</option>
                </select>
                <span className="arabic-text text-[10px] font-bold text-text-secondary">القارئ المفضل:</span>
              </div>
            )}

            {/* TTS Repeat Counter & Visual Activity Tracker */}
            {!playingAudio.isQuran && maxRepeats > 1 && (
              <div className="flex items-center justify-between px-2 text-xs" id="player-tts-repeat-bar">
                <div className="flex items-center gap-1.5 text-primary font-bold font-sans" id="tts-repeat-tracker">
                  <Repeat className="h-3.5 w-3.5" />
                  <span>{repeatProgress} / {maxRepeats}</span>
                </div>
                <span className="arabic-text text-[10px] font-bold text-text-secondary">تكرار الذكر التلقائي:</span>
              </div>
            )}

            {/* Progress Bar (Visible for MP3 files) */}
            {playingAudio.isQuran ? (
              <div className="flex flex-col gap-1 px-1" id="player-progress-bar-block">
                <div className="flex justify-between text-[10px] font-mono text-text-secondary" id="progress-times">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 accent-primary bg-border-custom rounded-lg appearance-none cursor-pointer"
                  id="player-progress-slider"
                />
              </div>
            ) : (
              /* Ambient TTS speech pulse visualizer */
              audioPlaying && (
                <div className="flex items-center justify-center gap-1 h-3 py-1" id="player-tts-pulse">
                  <div className="h-full w-0.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="h-full w-0.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  <div className="h-full w-0.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
                  <div className="h-full w-0.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="h-full w-0.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              )
            )}

            {/* Player Action Buttons Block */}
            <div className="flex items-center justify-between border-t border-border-custom/50 pt-3 mt-1" id="player-bottom-controls">
              
              {/* Playback speed controller (0.8x - 1.2x) */}
              <div className="flex rounded-full border border-border-custom p-0.5 bg-surface-muted" id="playback-speed-selector">
                <button
                  onClick={() => setPlaybackSpeed(0.8)}
                  className={`rounded-full px-2 py-1 text-[9px] font-mono font-bold transition-all ${
                    playbackSpeed === 0.8 ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
                  }`}
                  id="btn-speed-slow"
                >
                  0.8x
                </button>
                <button
                  onClick={() => setPlaybackSpeed(1.0)}
                  className={`rounded-full px-2 py-1 text-[9px] font-mono font-bold transition-all ${
                    playbackSpeed === 1.0 ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
                  }`}
                  id="btn-speed-norm"
                >
                  1.0x
                </button>
                <button
                  onClick={() => setPlaybackSpeed(1.2)}
                  className={`rounded-full px-2 py-1 text-[9px] font-mono font-bold transition-all ${
                    playbackSpeed === 1.2 ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
                  }`}
                  id="btn-speed-fast"
                >
                  1.2x
                </button>
              </div>

              {/* Main Play, Pause, Stop Controls */}
              <div className="flex items-center gap-3" id="player-main-btns">
                <button
                  onClick={stopAll}
                  className="p-2 rounded-full border border-border-custom hover:bg-surface-muted text-text-secondary hover:text-text-primary active-press transition-all"
                  title={isAr ? 'إيقاف' : 'Stop'}
                  id="btn-player-stop"
                >
                  <Square className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={handlePlayPause}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover active-press shadow-md shadow-primary/10 transition-all hover:scale-105"
                  id="btn-player-play-pause"
                  title={audioPlaying ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'تشغيل' : 'Play')}
                >
                  {audioPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-white ml-0.5" />}
                </button>
              </div>

              {/* Audio Volume / Mute button */}
              <button
                onClick={toggleMute}
                className={`p-2 rounded-full border border-border-custom hover:bg-surface-muted transition-all active-press ${
                  isMuted ? 'text-red-500 border-red-500/20 bg-red-500/5' : 'text-text-secondary hover:text-text-primary'
                }`}
                title={isMuted ? (isAr ? 'إلغاء الكتم' : 'Unmute') : (isAr ? 'كتم الصوت' : 'Mute')}
                id="btn-player-mute"
              >
                <Volume2 className={`h-4 w-4 ${isMuted ? 'line-through' : ''}`} />
              </button>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
