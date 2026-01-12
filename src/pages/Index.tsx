import React, { useState, useCallback } from 'react';
import Visualizer from '../components/Visualizer';
import ControlPanel from '../components/ControlPanel';
import PasswordGate from '../components/PasswordGate';
import { ThemeMode, PhysicsConfig, RealTimeStats, ShapeType } from '../types';
import { Sun, Moon, Info, Settings, Activity, Circle, Square, Triangle, Disc, Crown, Pause, Play, Zap, Target, CircleDot, Type } from 'lucide-react';

const Index: React.FC = () => {
  const [mode, setMode] = useState<ThemeMode>('night');
  const [showInfo, setShowInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [config, setConfig] = useState<PhysicsConfig>({
    particleCount: 800,
    maxSpeed: 6,
    attractStrength: 0.18,
    randomness: 0.22,
    damping: 0.92,
    shape: 'none',
    shapeSize: 1.0,
    separationForce: 0.5,
    restitution: 0.4,
    impactStrength: 1.0,
    glowIntensity: 0,
    isPaused: false,
    kingActive: false,
    antSkinUrl: null,
    limbElasticity: 1.2,
    antSize: 1.0,
    performanceMode: false,
    centerMode: false,
    textShape: ''
  });

  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');

  const [stats, setStats] = useState<RealTimeStats>({
    fps: 0,
    count: 0,
    targetX: 0,
    targetY: 0,
    trackingActive: false
  });

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'day' ? 'night' : 'day'));
    document.documentElement.classList.toggle('dark');
  }, []);

  const togglePause = useCallback(() => {
    setConfig((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const toggleKing = useCallback(() => {
    setConfig((prev) => ({ ...prev, kingActive: !prev.kingActive }));
  }, []);

  const togglePerformanceMode = useCallback(() => {
    setConfig((prev) => ({ ...prev, performanceMode: !prev.performanceMode }));
  }, []);

  const toggleCenterMode = useCallback(() => {
    setConfig((prev) => ({ ...prev, centerMode: !prev.centerMode }));
  }, []);

  const handleStatsUpdate = useCallback((newStats: RealTimeStats) => {
    setStats(newStats);
  }, []);

  const setShape = (shape: ShapeType) => {
    setConfig((prev) => ({ ...prev, shape }));
    if (shape === 'text') {
      setShowTextInput(true);
    }
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }
  };

  const handleTextSubmit = () => {
    if (textInputValue.trim()) {
      setConfig((prev) => ({ ...prev, textShape: textInputValue.trim(), shape: 'text' }));
      setShowTextInput(false);
    }
  };

  // Initialize dark mode
  React.useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <PasswordGate>
    <div className="relative w-full h-screen transition-colors duration-500 overflow-hidden bg-background">
      <Visualizer mode={mode} config={config} onStatsUpdate={handleStatsUpdate} />

      {/* Top Controls */}
      <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-start pointer-events-none">
        {/* Left Panel */}
        <div className="pointer-events-auto flex flex-col gap-3 md:gap-4">
          {/* Title */}
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase leading-none text-foreground">
              AntHive
            </h1>
            <span className="text-[9px] md:text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground">
              彈性生物模擬器
            </span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={toggleMode}
              className="p-2.5 md:p-3 rounded-full transition-all active:scale-90 shadow-lg glass-button bg-primary text-primary-foreground"
            >
              {mode === 'day' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <button
              onClick={togglePause}
              className={`p-2.5 md:p-3 px-3 md:px-4 rounded-full transition-all active:scale-90 shadow-lg flex items-center gap-2 glass-button ${
                config.isPaused
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-secondary text-secondary-foreground border border-border'
              }`}
            >
              {config.isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
                {config.isPaused ? '暫停' : '啟動'}
              </span>
            </button>

            <button
              onClick={toggleKing}
              className={`p-2.5 md:p-3 px-3 md:px-4 rounded-full transition-all active:scale-90 shadow-lg flex items-center gap-2 glass-button ${
                config.kingActive
                  ? 'bg-king text-king-foreground animate-pulse-glow'
                  : 'bg-secondary text-secondary-foreground border border-border'
              }`}
            >
              <Crown size={16} />
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider hidden sm:inline">蟻王</span>
            </button>

            <button
              onClick={togglePerformanceMode}
              className={`p-2.5 md:p-3 px-3 md:px-4 rounded-full transition-all active:scale-90 shadow-lg flex items-center gap-2 glass-button ${
                config.performanceMode
                  ? 'bg-green-500 text-white'
                  : 'bg-secondary text-secondary-foreground border border-border'
              }`}
              title="效能模式"
            >
              <Zap size={16} />
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider hidden sm:inline">效能</span>
            </button>

            <button
              onClick={toggleCenterMode}
              className={`p-2.5 md:p-3 px-3 md:px-4 rounded-full transition-all active:scale-90 shadow-lg flex items-center gap-2 glass-button ${
                config.centerMode
                  ? 'bg-blue-500 text-white'
                  : 'bg-secondary text-secondary-foreground border border-border'
              }`}
              title="中心模式"
            >
              <Target size={16} />
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider hidden sm:inline">中心</span>
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2.5 md:p-3 rounded-full transition-all active:scale-90 shadow-lg glass-button ${
                showSettings
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground border border-border'
              }`}
            >
              <Settings size={16} />
            </button>
          </div>

          {/* Shape Selector */}
          <div className="p-1.5 md:p-2 rounded-2xl glass-panel flex gap-1 transition-all duration-300">
            <button
              onClick={() => setShape('none')}
              className={`p-2 rounded-lg transition-all ${
                config.shape === 'none' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
              title="自由模式"
            >
              <Activity size={16} />
            </button>
            <button
              onClick={() => setShape('donut')}
              className={`p-2 rounded-lg transition-all ${
                config.shape === 'donut' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
              title="環形"
            >
              <Disc size={16} />
            </button>
            <button
              onClick={() => setShape('circle')}
              className={`p-2 rounded-lg transition-all ${
                config.shape === 'circle' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
              title="圓形"
            >
              <Circle size={16} />
            </button>
            <button
              onClick={() => setShape('square')}
              className={`p-2 rounded-lg transition-all ${
                config.shape === 'square' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
              title="方形"
            >
              <Square size={16} />
            </button>
            <button
              onClick={() => setShape('triangle')}
              className={`p-2 rounded-lg transition-all ${
                config.shape === 'triangle' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
              title="三角形"
            >
              <Triangle size={16} />
            </button>
            <button
              onClick={() => setShape('filled-circle')}
              className={`p-2 rounded-lg transition-all ${
                config.shape === 'filled-circle' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
              title="實心圓"
            >
              <CircleDot size={16} />
            </button>
            <button
              onClick={() => setShape('text')}
              className={`p-2 rounded-lg transition-all ${
                config.shape === 'text' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
              title="文字陣型"
            >
              <Type size={16} />
            </button>
          </div>

          {/* Text Input for Text Shape */}
          {showTextInput && (
            <div className="p-3 rounded-2xl glass-panel flex gap-2 items-center animate-fade-in">
              <input
                type="text"
                value={textInputValue}
                onChange={(e) => setTextInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                placeholder="輸入文字..."
                className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <button
                onClick={handleTextSubmit}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold"
              >
                確定
              </button>
              <button
                onClick={() => setShowTextInput(false)}
                className="px-3 py-2 rounded-lg bg-muted text-muted-foreground text-sm"
              >
                取消
              </button>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2.5 md:p-3 rounded-full transition-all active:scale-90 shadow-lg glass-button bg-primary text-primary-foreground"
          >
            <Info size={16} />
          </button>

          {/* Stats Panel */}
          <div className="p-3 md:p-4 rounded-2xl glass-panel flex flex-col gap-1 min-w-[120px] md:min-w-[140px] transition-all duration-300">
            <div className="flex items-center gap-2 mb-1 border-b pb-1 border-border">
              <Activity size={10} className="text-muted-foreground" />
              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                生物特徵
              </span>
            </div>
            <div className="flex justify-between text-[10px] md:text-[11px] font-mono">
              <span className="text-muted-foreground uppercase">FPS</span>
              <span className="font-bold">{stats.fps}</span>
            </div>
            <div className="flex justify-between text-[10px] md:text-[11px] font-mono">
              <span className="text-muted-foreground uppercase">彈性</span>
              <span className="font-bold text-king">{config.limbElasticity.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-[10px] md:text-[11px] font-mono">
              <span className="text-muted-foreground uppercase">數量</span>
              <span className="font-bold">{config.particleCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <ControlPanel isOpen={showSettings} onClose={() => setShowSettings(false)} config={config} setConfig={setConfig} mode={mode} />

      {/* Info Modal */}
      {showInfo && (
        <div
          className="absolute inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-background/60 backdrop-blur-sm pointer-events-auto animate-fade-in"
          onClick={() => setShowInfo(false)}
        >
          <div
            className="max-w-md w-full p-6 md:p-8 rounded-3xl shadow-2xl space-y-4 bg-card text-card-foreground border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl md:text-2xl font-bold tracking-tighter text-king uppercase italic">
              Procedural Ant
            </h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              我們升級了螞蟻的解剖結構，現在肢體具備「橡筋」般的動態物理效果。
            </p>
            <ul className="text-xs text-muted-foreground space-y-3 border-l-2 border-king pl-4">
              <li>
                • <strong className="text-foreground">慣性滯後:</strong> 腿部與觸角會根據移動速度產生物理性的延遲擺動。
              </li>
              <li>
                • <strong className="text-foreground">多關節渲染:</strong> 每一條腿都由三個關節組成，動作更接近真實生物。
              </li>
              <li>
                • <strong className="text-foreground">彈性係數:</strong> 可以在設定中調節「肢體彈性」，讓動作更軟Q或更僵硬。
              </li>
            </ul>
            <button
              onClick={() => setShowInfo(false)}
              className="w-full py-3 md:py-4 rounded-xl font-bold mt-4 bg-king text-king-foreground hover:opacity-90 transition-opacity shadow-lg uppercase tracking-widest text-xs"
            >
              進入實驗室
            </button>
          </div>
        </div>
      )}
    </div>
    </PasswordGate>
  );
};

export default Index;
