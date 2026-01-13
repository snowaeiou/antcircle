import React, { useState, useEffect } from 'react';
import { PhysicsConfig, ThemeMode } from '../types';
import { X, Sliders, Users, FastForward, Magnet, Pause, Play, Crown, Maximize, Image as ImageIcon, Wind, Zap, Scaling, Shuffle, Save, Download, Upload, ImagePlus, Eye, EyeOff, Trash2 } from 'lucide-react';

interface ControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: PhysicsConfig;
  setConfig: React.Dispatch<React.SetStateAction<PhysicsConfig>>;
  mode: ThemeMode;
}

interface SavedPreset {
  name: string;
  config: Partial<PhysicsConfig>;
}

const PRESET_STORAGE_KEY = 'anthive_presets';
const MAX_PRESETS = 3;

// Keys to save in presets (exclude runtime states)
const PRESET_KEYS: (keyof PhysicsConfig)[] = [
  'particleCount', 'maxSpeed', 'attractStrength', 'damping', 
  'shapeSize', 'limbElasticity', 'antSize', 'sizeVariation'
];

const ControlPanel: React.FC<ControlPanelProps> = ({ isOpen, onClose, config, setConfig, mode }) => {
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [presetName, setPresetName] = useState('');

  // Load presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(PRESET_STORAGE_KEY);
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load presets:', e);
      }
    }
  }, []);

  // Save presets to localStorage
  const savePresetsToStorage = (newPresets: SavedPreset[]) => {
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(newPresets));
    setPresets(newPresets);
  };

  const handleChange = (key: keyof PhysicsConfig, val: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(5);
    }
  };

  const handleSavePreset = () => {
    if (presets.length >= MAX_PRESETS) {
      return;
    }
    const name = presetName.trim() || `預設 ${presets.length + 1}`;
    const presetConfig: Partial<PhysicsConfig> = {};
    PRESET_KEYS.forEach(key => {
      (presetConfig as any)[key] = config[key];
    });
    const newPresets = [...presets, { name, config: presetConfig }];
    savePresetsToStorage(newPresets);
    setPresetName('');
  };

  const handleLoadPreset = (preset: SavedPreset) => {
    setConfig(prev => ({ ...prev, ...preset.config }));
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
  };

  const handleDeletePreset = (index: number) => {
    const newPresets = presets.filter((_, i) => i !== index);
    savePresetsToStorage(newPresets);
  };

  const handleExportPresets = () => {
    if (presets.length === 0) return;
    const dataStr = JSON.stringify(presets, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'anthive-presets.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportPresets = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string) as SavedPreset[];
        if (!Array.isArray(imported)) throw new Error('Invalid format');
        
        // Merge with existing, up to max
        const merged = [...presets];
        for (const preset of imported) {
          if (merged.length >= MAX_PRESETS) break;
          if (preset.name && preset.config) {
            merged.push(preset);
          }
        }
        savePresetsToStorage(merged.slice(0, MAX_PRESETS));
      } catch (err) {
        console.error('Failed to import presets:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Background image upload
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      console.error('Invalid file type');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      handleChange('backgroundUrl', dataUrl);
      handleChange('backgroundEnabled', true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveBackground = () => {
    handleChange('backgroundUrl', null);
    handleChange('backgroundEnabled', false);
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
        {/* Preset Section */}
        <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Save size={12} /> 預設儲存 ({presets.length}/{MAX_PRESETS})
          </label>

          {/* Saved Presets */}
          {presets.length > 0 && (
            <div className="space-y-2">
              {presets.map((preset, index) => (
                <div key={index} className="flex items-center gap-2">
                  <button
                    onClick={() => handleLoadPreset(preset)}
                    className="flex-1 py-2 px-3 text-left text-xs font-bold bg-muted hover:bg-primary hover:text-primary-foreground rounded-lg transition-all truncate"
                  >
                    {preset.name}
                  </button>
                  <button
                    onClick={() => handleDeletePreset(index)}
                    className="p-2 hover:bg-destructive hover:text-destructive-foreground rounded-lg transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Save New Preset */}
          {presets.length < MAX_PRESETS && (
            <div className="flex gap-2">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder={`預設 ${presets.length + 1}`}
                className="flex-1 px-3 py-2 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                maxLength={20}
              />
              <button
                onClick={handleSavePreset}
                className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                title="儲存預設"
              >
                <Save size={14} />
              </button>
            </div>
          )}

          {/* Export/Import */}
          <div className="flex gap-2 pt-2 border-t border-border">
            <button
              onClick={handleExportPresets}
              disabled={presets.length === 0}
              className="flex-1 py-2 px-3 text-xs font-bold bg-muted hover:bg-accent hover:text-accent-foreground rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              title="匯出預設"
            >
              <Download size={12} /> 匯出
            </button>
            <label className="flex-1 py-2 px-3 text-xs font-bold bg-muted hover:bg-accent hover:text-accent-foreground rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer">
              <Upload size={12} /> 匯入
              <input
                type="file"
                accept=".json"
                onChange={handleImportPresets}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Background Section */}
        <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <ImagePlus size={12} /> 背景圖片
          </label>

          {/* Upload / Current Background */}
          {config.backgroundUrl ? (
            <div className="space-y-3">
              {/* Preview */}
              <div className="relative rounded-lg overflow-hidden border border-border h-20">
                <img
                  src={config.backgroundUrl}
                  alt="Background"
                  className="w-full h-full object-cover"
                  style={{ transform: `scale(${config.backgroundScale})` }}
                />
              </div>
              
              {/* Toggle & Delete */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleChange('backgroundEnabled', !config.backgroundEnabled)}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    config.backgroundEnabled
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {config.backgroundEnabled ? <Eye size={12} /> : <EyeOff size={12} />}
                  {config.backgroundEnabled ? '顯示' : '隱藏'}
                </button>
                <button
                  onClick={handleRemoveBackground}
                  className="py-2 px-3 text-xs font-bold bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <Trash2 size={12} /> 移除
                </button>
              </div>

              {/* Scale Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground">縮放</span>
                  <span className="text-xs font-mono font-bold">{(config.backgroundScale * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={config.backgroundScale}
                  onChange={(e) => handleChange('backgroundScale', parseFloat(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
              <ImagePlus size={24} className="text-muted-foreground mb-2" />
              <span className="text-xs font-bold text-muted-foreground">點擊上傳 JPG/PNG</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleBackgroundUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Appearance Section */}
        <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <ImageIcon size={12} /> 外觀與彈性
          </label>

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
