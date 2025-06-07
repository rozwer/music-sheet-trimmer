import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  // ステップ管理
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    'アップロード',
    '順序設定',
    '基準トリミング',
    '全体調整',
    
    'レイアウト',
    '出力'
  ];

  // 画像データ管理
  const [images, setImages] = useState([]);
    // トリミング設定
  const [trimSettings, setTrimSettings] = useState({
    height: 0,
    yPosition: 0,
    applied: false
  });
  
  // Y軸プリセット管理
  const [yAxisPresets, setYAxisPresets] = useState([]);
  
  // レイアウト設定
  const [layoutSettings, setLayoutSettings] = useState({
    outputSize: 'a4',
    orientation: 'portrait',
    columns: 1,
    direction: 'horizontal',
    spacing: '0',
    customSize: { width: 0, height: 0 }
  });

  // 画像の追加
  const addImages = (newImages) => {
    setImages(prevImages => [...prevImages, ...newImages]);
  };

  // 画像の削除
  const removeImage = (index) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };
  // 画像の並び替え
  const reorderImages = (oldIndex, newIndex) => {
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(oldIndex, 1);
    updatedImages.splice(newIndex, 0, movedImage);
    setImages(updatedImages);
  };

  // Y軸プリセット関連の関数
  const addYAxisPreset = (yOffset, name = '') => {
    const presetName = name || `プリセット ${yAxisPresets.length + 1}`;
    const newPreset = {
      id: Date.now(),
      name: presetName,
      yOffset: yOffset,
      createdAt: new Date().toISOString()
    };
    setYAxisPresets(prev => [...prev, newPreset]);
    return newPreset;
  };

  const removeYAxisPreset = (presetId) => {
    setYAxisPresets(prev => prev.filter(preset => preset.id !== presetId));
  };

  const updateYAxisPreset = (presetId, updates) => {
    setYAxisPresets(prev => prev.map(preset => 
      preset.id === presetId ? { ...preset, ...updates } : preset
    ));
  };

  // 次のステップへ
  const nextStep = () => {
    // 画像が1枚しかない場合、全体調整ステップをスキップ
    if (currentStep === 1 && images.length === 1) {
      setCurrentStep(currentStep + 2); // 順序設定へ直接進む
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // 前のステップへ
  const prevStep = () => {
    // 画像が1枚しかない場合、全体調整ステップをスキップ
    if (currentStep === 3 && images.length === 1) {
      setCurrentStep(currentStep - 2); // 基準トリミングへ直接戻る
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  const value = {
    currentStep,
    setCurrentStep,
    steps,
    images,
    setImages,
    addImages,
    removeImage,
    reorderImages,
    trimSettings,
    setTrimSettings,
    yAxisPresets,
    setYAxisPresets,
    addYAxisPreset,
    removeYAxisPreset,
    updateYAxisPreset,
    layoutSettings,
    setLayoutSettings,
    nextStep,
    prevStep
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}