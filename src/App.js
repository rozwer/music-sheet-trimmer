import React from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import ImageUploader from './components/ImageUploader';
import './App.css';
import { Box, Stepper, Step, StepLabel, Button, Typography, Container, Paper } from '@mui/material';
import ImageTrimmer from './components/ImageTrimmer';
import LayoutSettings from './components/LayoutSettings';
import OutputGenerator from './components/OutputGenerator';
// 後で実装するコンポーネント（現時点ではプレースホルダー）



function AppContent() {
  const { currentStep, steps, nextStep, prevStep, images } = useAppContext();

  // 現在のステップに応じたコンポーネントを表示
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <ImageUploader />;
      case 1:
        return <ImageTrimmer />;
      case 2:
        return <LayoutSettings />;
      case 3:
        return <OutputGenerator />;
      default:
        return <div>不明なステップ</div>;
    }
  };

  // 次のステップに進むボタンを無効化する条件
  const isNextDisabled = () => {
    if (currentStep === 0 && images.length === 0) return true;
    return false;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          楽譜トリミング・レイアウトアプリ
        </Typography>
        
        <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
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