import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Divider
} from '@mui/material';
import SubsequentImageTrimmer from './SubsequentImageTrimmer';
import ImageIcon from '@mui/icons-material/Image';

const SubsequentImagesTrimmer = () => {
  const { images, trimSettings } = useAppContext();
  // 2枚目の画像のインデックス（配列では1）に対応するタブ値（0）から開始
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [previewsExpanded, setPreviewsExpanded] = useState(true);

  // タブのインデックスが画像数を超えた場合の調整
  useEffect(() => {
    if (selectedTabIndex >= images.length - 1) {
      setSelectedTabIndex(Math.max(0, images.length - 2));
    }
  }, [images.length, selectedTabIndex]);

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

  // プレビューカードクリックでタブを切り替え
  const handlePreviewClick = (index) => {
    // 画像の実際のインデックスから、タブのインデックス（0ベース）に変換
    setSelectedTabIndex(index - 1);
  };

  // タブインデックスから実際の画像インデックスを計算（タブは0から、実際の画像は2枚目=インデックス1から）
  const currentImageIndex = selectedTabIndex + 1;

  // プレビュー表示用の画像ソース取得関数
  const getImagePreview = (img, index) => {
    // trimmedPreviewがある場合はそれを使用、なければ元の画像
    return img.trimmedPreview || img.preview;
  };

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

      {/* プレビューセクション - すべての編集後画像を表示 */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 2
          }}
        >
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
            <ImageIcon sx={{ mr: 1 }} />
            全画像プレビュー
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          編集済みの全画像を表示しています。画像をクリックすると選択できます。
        </Typography>
        
        <Box sx={{ maxHeight: '600px', overflow: 'auto', pb: 1 }}>
          <Grid container spacing={2} direction="column">
            {images.slice(1).map((image, index) => {
              const actualIndex = index + 1; // 実際の画像インデックス
              const isSelected = actualIndex === currentImageIndex;
              
              return (
                <Grid item key={index}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      borderLeft: isSelected ? '4px solid #1976d2' : '4px solid transparent',
                      boxShadow: isSelected ? 3 : 1,
                      bgcolor: isSelected ? 'rgba(25, 118, 210, 0.04)' : 'inherit'
                    }}
                    onClick={() => handlePreviewClick(actualIndex)}
                  >
                    <Grid container>
                      <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
                          画像 {actualIndex + 1}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={10}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center',
                          height: '200px',
                          bgcolor: '#f5f5f5',
                          overflow: 'hidden',
                          '& img': {
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                          }
                        }}>
                          <img 
                            src={getImagePreview(image, actualIndex)} 
                            alt={`画像 ${actualIndex + 1} プレビュー`}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default SubsequentImagesTrimmer;