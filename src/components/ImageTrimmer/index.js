import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import FirstImageTrimmer from './FirstImageTrimmer';
import SubsequentImageTrimmer from './SubsequentImageTrimmer';

const ImageTrimmer = () => {
  const { images, trimSettings } = useAppContext();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 画像がない場合
  if (images.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Typography variant="h6" color="text.secondary">
          トリミングする画像がありません。前のステップに戻って画像をアップロードしてください。
        </Typography>
      </Box>
    );
  }

  // タブ切り替え処理
  const handleTabChange = (event, newValue) => {
    setCurrentImageIndex(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        画像のトリミング
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 2 }}>
        {currentImageIndex === 0 ? 
          '1枚目の画像で楽譜のトリミング範囲を指定します。この設定が他の画像にも適用されます。' : 
          '自動適用されたトリミングを必要に応じて調整できます。'}
      </Typography>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={currentImageIndex}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {images.map((image, index) => (
            <Tab 
              key={index} 
              label={`画像 ${index + 1}`} 
              id={`image-tab-${index}`}
              aria-controls={`image-tabpanel-${index}`}
            />
          ))}
        </Tabs>
      </Paper>

      <Box sx={{ mt: 2 }}>
        {currentImageIndex === 0 ? (
          <FirstImageTrimmer 
            image={images[0]} 
            imageIndex={0} 
          />
        ) : (
          <SubsequentImageTrimmer 
            image={images[currentImageIndex]} 
            imageIndex={currentImageIndex}
            trimSettings={trimSettings}
          />
        )}
      </Box>
    </Box>
  );
};

export default ImageTrimmer;