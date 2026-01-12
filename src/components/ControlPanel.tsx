import React, { useRef } from 'react';
import { PhysicsConfig, ThemeMode } from '../types';
import { X, Sliders, Users, FastForward, Magnet, Waves, Pause, Play, Crown, Maximize, Upload, Trash2, Image as ImageIcon, Wind, Zap, Scaling, Shuffle } from 'lucide-react';

interface ControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: PhysicsConfig;
  setConfig: React.Dispatch<React.SetStateAction<PhysicsConfig>>;
  mode: ThemeMode;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ isOpen, onClose, config, setConfig, mode }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (key: keyof PhysicsConfig, val: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(5);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type - only allow safe image formats (no SVG/HTML)
      const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        console.error('Invalid file type. Only PNG, JPEG, GIF, and WebP are allowed.');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.error('File too large. Maximum size is 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        handleChange('antSkinUrl', url);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed right-0 top-0 h-full w-full max-w-[320px] z-[110] shadow-2xl p-8 animate-in slide-in-from-right duration-300 backdrop-blur-xl border-l transition-colors overflow-y-auto ${
        mode === 'day' ? 'bg-background/90 border-border text-foreground' : 'bg-background/90 border-border text-foreground'
      }`}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Sliders className="text-primary" size={20} />
          <h2 className="font-black uppercase tracking-tighter text-xl italic">物理實驗室</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-6 pb-12">
        {/* Appearance Section */}
        <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <ImageIcon size={12} /> 外觀與彈性
          </label>

          <div className="flex flex-col gap-3">
            {!config.antSkinUrl ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 border-2 border-dashed border-border rounded-xl flex flex-col items-center gap-2 hover:border-primary hover:text-primary transition-all group"
              >
                <Upload size={24} className="group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-widest">上傳自定義造型 (PNG)</span>
              </button>
            ) : (
              <div className="relative group">
                <img
                  src={config.antSkinUrl}
                  alt="Skin Preview"
                  className="w-full h-32 object-contain bg-muted rounded-xl p-4 border border-border"
                />
                <button
                  onClick={() => handleChange('antSkinUrl', null)}
                  className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" />
          </div>

          {/* Ant Size Slider */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Scaling size={12} className="text-accent" /> 螞蟻大小
              </label>
              <span className="text-xs font-mono font-bold">{config.antSize.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="5.0"
              step="0.1"
              value={config.antSize}
              onChange={(e) => handleChange('antSize', parseFloat(e.target.value))}
              className="w-full accent-accent h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Size Variation Slider */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Shuffle size={12} className="text-primary" /> 大小差異
              </label>
              <span className="text-xs font-mono font-bold">{(config.sizeVariation * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.0"
              step="0.05"
              value={config.sizeVariation}
              onChange={(e) => handleChange('sizeVariation', parseFloat(e.target.value))}
              className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Limb Elasticity Slider */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Zap size={12} className="text-king" /> 肢體彈性 (橡筋感)
              </label>
              <span className="text-xs font-mono font-bold">{config.limbElasticity.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={config.limbElasticity}
              onChange={(e) => handleChange('limbElasticity', parseFloat(e.target.value))}
              className="w-full accent-king h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Quick Toggles */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleChange('isPaused', !config.isPaused)}
            className={`p-3 rounded-xl flex flex-col items-center gap-2 border transition-all ${
              config.isPaused ? 'bg-destructive border-destructive text-destructive-foreground' : 'bg-muted/50 border-border'
            }`}
          >
            {config.isPaused ? <Play size={18} /> : <Pause size={18} />}
            <span className="text-[10px] font-bold uppercase tracking-widest">暫停模擬</span>
          </button>
          <button
            onClick={() => handleChange('kingActive', !config.kingActive)}
            className={`p-3 rounded-xl flex flex-col items-center gap-2 border transition-all ${
              config.kingActive ? 'bg-king border-king text-king-foreground' : 'bg-muted/50 border-border'
            }`}
          >
            <Crown size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">蟻王開關</span>
          </button>
        </div>

        {/* Shape Size */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Maximize size={12} className="text-primary" /> 陣型規模
            </label>
            <span className="text-xs font-mono font-bold">{config.shapeSize.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.1"
            value={config.shapeSize}
            onChange={(e) => handleChange('shapeSize', parseFloat(e.target.value))}
            className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Population */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Users size={12} /> 群體數量
            </label>
            <span className="text-xs font-mono font-bold">{config.particleCount}</span>
          </div>
          <input
            type="range"
            min="100"
            max="2000"
            step="50"
            value={config.particleCount}
            onChange={(e) => handleChange('particleCount', parseInt(e.target.value))}
            className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Max Speed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <FastForward size={12} /> 最高速限
            </label>
            <span className="text-xs font-mono font-bold">{config.maxSpeed.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            step="0.5"
            value={config.maxSpeed}
            onChange={(e) => handleChange('maxSpeed', parseFloat(e.target.value))}
            className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Attract Strength */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Magnet size={12} className="text-primary" /> 引力強度
            </label>
            <span className="text-xs font-mono font-bold">{config.attractStrength.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="0.5"
            step="0.01"
            value={config.attractStrength}
            onChange={(e) => handleChange('attractStrength', parseFloat(e.target.value))}
            className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Friction (Damping) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Wind size={12} /> 摩擦阻力
            </label>
            <span className="text-xs font-mono font-bold">{config.damping.toFixed(3)}</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="0.99"
            step="0.001"
            value={config.damping}
            onChange={(e) => handleChange('damping', parseFloat(e.target.value))}
            className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-border text-center">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-relaxed">
          肢體物理已升級：程序化三段關節與動態慣性滯後系統
        </p>
      </div>
    </div>
  );
};

export default ControlPanel;
