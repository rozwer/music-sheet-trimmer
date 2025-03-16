import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  // ステップ管理
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ['アップロード', 'トリミング', 'レイアウト', '出力'];

  // 画像データ管理
  const [images, setImages] = useState([]);
  
  // トリミング設定
  const [trimSettings, setTrimSettings] = useState({
    height: 0,
    yPosition: 0,
    applied: false
  });
  
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

  // 次のステップへ
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // 前のステップへ
  const prevStep = () => {
    if (currentStep > 0) {
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