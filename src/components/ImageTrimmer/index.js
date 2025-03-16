import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper, 
  IconButton, 
  Grid, 
  Card, 
  CardMedia, 
  CardActions, 
  CardContent,
  Tooltip,
  Divider
} from '@mui/material';
import FirstImageTrimmer from './FirstImageTrimmer';
import SubsequentImageTrimmer from './SubsequentImageTrimmer';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SwapVertIcon from '@mui/icons-material/SwapVert';

const ImageTrimmer = () => {
  const { images, setImages, trimSettings } = useAppContext();
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

  // 画像を上に移動（順序を前に）
  const moveImageUp = (index) => {
    if (index <= 0) return; // 既に最初なら何もしない
    
    const updatedImages = [...images];
    // 選択した画像と1つ前の画像を入れ替え
    [updatedImages[index], updatedImages[index-1]] = [updatedImages[index-1], updatedImages[index]];
    
    setImages(updatedImages);
    
    // アクティブな画像も一緒に移動
    if (currentImageIndex === index) {
      setCurrentImageIndex(index - 1);
    } else if (currentImageIndex === index - 1) {
      setCurrentImageIndex(index);
    }
  };
  
  // 画像を下に移動（順序を後ろに）
  const moveImageDown = (index) => {
    if (index >= images.length - 1) return; // 既に最後なら何もしない
    
    const updatedImages = [...images];
    // 選択した画像と1つ後の画像を入れ替え
    [updatedImages[index], updatedImages[index+1]] = [updatedImages[index+1], updatedImages[index]];
    
    setImages(updatedImages);
    
    // アクティブな画像も一緒に移動
    if (currentImageIndex === index) {
      setCurrentImageIndex(index + 1);
    } else if (currentImageIndex === index + 1) {
      setCurrentImageIndex(index);
    }
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

      {/* 元のタブインターフェースを保持 */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={currentImageIndex}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="画像タブ"
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

      {/* 選択中の画像のトリミングエリア */}
      <Box role="tabpanel" sx={{ mb: 4 }}>
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

      {/* 並べ替えセクションを最下部に追加 */}
      <Divider sx={{ my: 4 }} />
      
      <Paper sx={{ width: '100%', p: 2, mt: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <SwapVertIcon sx={{ mr: 1 }} />
          画像の順序変更
        </Typography>
        
        <Grid container spacing={2}>
          {images.map((image, index) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={index}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: currentImageIndex === index ? '2px solid #1976d2' : '1px solid #ddd',
                  boxShadow: currentImageIndex === index ? 3 : 1
                }}
                onClick={() => setCurrentImageIndex(index)}
              >
                <CardMedia
                  component="img"
                  height="100"
                  image={image.preview}
                  alt={`画像 ${index + 1}`}
                  sx={{ objectFit: 'contain', bgcolor: '#f5f5f5' }}
                />
                <CardContent sx={{ p: 1, pb: '4px !important' }}>
                  <Typography variant="caption" sx={{ fontWeight: currentImageIndex === index ? 'bold' : 'normal' }}>
                    {index + 1}. {image.name ? (image.name.length > 15 ? image.name.substring(0, 15) + '...' : image.name) : '画像'}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 0.5, justifyContent: 'space-between' }}>
                  <Tooltip title="前に移動">
                    <span>
                      <IconButton 
                        size="small" 
                        disabled={index === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveImageUp(index);
                        }}
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="後ろに移動">
                    <span>
                      <IconButton 
                        size="small" 
                        disabled={index === images.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveImageDown(index);
                        }}
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default ImageTrimmer;