import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper
} from '@mui/material';
import SubsequentImageTrimmer from './SubsequentImageTrimmer';

const SubsequentImagesTrimmer = () => {
  const { images, trimSettings } = useAppContext();
  // 2枚目の画像のインデックス（配列では1）に対応するタブ値（0）から開始
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  // 画像がない、または1枚しかない場合
  if (images.length <= 1) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Typography variant="h6" color="text.secondary">
          {images.length === 0 
            ? 'トリミングする画像がありません。前のステップに戻って画像をアップロードしてください。'
            : '2枚目以降の画像がありません。前のステップに戻って複数の画像をアップロードしてください。'
          }
        </Typography>
      </Box>
    );
  }

  // タブ切り替え処理
  const handleTabChange = (event, newValue) => {
    setSelectedTabIndex(newValue);
  };

  // タブインデックスから実際の画像インデックスを計算（タブは0から、実際の画像は2枚目=インデックス1から）
  const currentImageIndex = selectedTabIndex + 1;

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        全画像のトリミング調整
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 2 }}>
        自動適用されたトリミングを必要に応じて各画像ごとに調整できます。
      </Typography>

      {/* タブインターフェース */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={selectedTabIndex}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="画像タブ"
        >
          {images.slice(1).map((image, index) => (
            <Tab 
              key={index}
              label={`画像 ${index + 2}`} // 2枚目からなので+2
              id={`image-tab-${index}`}
              aria-controls={`image-tabpanel-${index}`}
            />
          ))}
        </Tabs>
      </Paper>

      {/* 選択中の画像のトリミングエリア */}
      <Box role="tabpanel" sx={{ mb: 4 }}>
        <SubsequentImageTrimmer 
          image={images[currentImageIndex]}
          imageIndex={currentImageIndex}
          trimSettings={trimSettings}
        />
      </Box>
    </Box>
  );
};

export default SubsequentImagesTrimmer;