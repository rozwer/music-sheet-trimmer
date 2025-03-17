import React from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import ImageUploader from './components/ImageUploader';
import './App.css';
import { Box, Stepper, Step, StepLabel, Button, Typography, Container, Paper } from '@mui/material';
import ImageTrimmer from './components/ImageTrimmer';
import SubsequentImagesTrimmer from './components/ImageTrimmer/index2';
import TimeSettings from './components/TrimSettings';
import LayoutSettings from './components/LayoutSettings';
import OutputGenerator from './components/OutputGenerator';

function AppContent() {
  const { currentStep, steps, nextStep, prevStep, images } = useAppContext();

  // 現在のステップに応じたコンポーネントを表示
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <ImageUploader />;
      case 2:
        return <ImageTrimmer />;
      case 3:
        return <SubsequentImagesTrimmer />;
      case 1:
        return <TimeSettings />;
      case 4:
        return <LayoutSettings />;
      case 5:
        return <OutputGenerator />;
      default:
        return <div>不明なステップ</div>;
    }
  };

  // 次のステップに進むボタンを無効化する条件
  const isNextDisabled = () => {
    if (currentStep === 0 && images.length === 0) return true;
    // トリミング設定が必要な場合はここに追加
    return false;
  };

  // 特定のステップの表示制御
  const shouldSkipStep = (step) => {
    // 画像が1枚しかない場合、全体調整ステップをスキップ
    return step === 2 && images.length === 1;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          楽譜トリミング・レイアウトアプリ
        </Typography>
        
        <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label} disabled={shouldSkipStep(index)}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 2, minHeight: '60vh' }}>
          {renderStepContent()}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
          <Button
            color="inherit"
            disabled={currentStep === 0}
            onClick={prevStep}
            sx={{ mr: 1 }}
          >
            戻る
          </Button>
          <Box sx={{ flex: '1 1 auto' }} />
          <Button 
            onClick={nextStep}
            disabled={isNextDisabled()}
          >
            {currentStep === steps.length - 1 ? '完了' : '次へ'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;