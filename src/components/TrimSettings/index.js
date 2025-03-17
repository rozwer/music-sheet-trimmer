import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { 
  Box, 
  Typography, 
  Paper, 
  IconButton, 
  Grid, 
  Card, 
  CardMedia, 
  CardActions, 
  CardContent,
  Tooltip,
  Button,
  Divider
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';

const TimeSettings = () => {
  const { images, setImages } = useAppContext();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 画像がない場合
  if (images.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Typography variant="h6" color="text.secondary">
          順序を変更する画像がありません。前のステップに戻って画像をアップロードしてください。
        </Typography>
      </Box>
    );
  }

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

  // 画像を複製する
  const duplicateImage = (index) => {
    const imageToDuplicate = images[index];
    // ディープコピーを作成
    const duplicatedImage = {
      ...imageToDuplicate,
      name: `${imageToDuplicate.name} (複製)`,
      id: `${imageToDuplicate.id || Date.now()}_copy`
    };
    
    const updatedImages = [...images];
    // 選択した画像の直後に複製を挿入
    updatedImages.splice(index + 1, 0, duplicatedImage);
    
    setImages(updatedImages);
  };

  // 画像を削除する
  const deleteImage = (index) => {
    if (images.length <= 1) {
      // 最後の画像は削除できないようにする（UIでも制御可能）
      return;
    }
    
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    
    // インデックスの調整
    if (currentImageIndex >= updatedImages.length) {
      setCurrentImageIndex(updatedImages.length - 1);
    } else if (currentImageIndex > index) {
      // 削除した画像より後ろのインデックスを持つ場合は1つ減らす
      setCurrentImageIndex(currentImageIndex - 1);
    }
    
    setImages(updatedImages);
  };

  // 現在選択されている画像
  const selectedImage = images[currentImageIndex];

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        画像の順序設定
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 2 }}>
        画像の順序を変更して、最終的な楽譜の並び順を調整できます。
      </Typography>

      {/* 選択した画像のプレビュー */}
      <Paper sx={{ width: '100%', p: 2, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <ImageIcon sx={{ mr: 1 }} />
          選択中の画像プレビュー
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center'
        }}>
          <Box sx={{ 
            width: '100%', 
            maxHeight: '500px', 
            display: 'flex',
            justifyContent: 'center',
            mb: 2,
            bgcolor: '#f5f5f5',
            borderRadius: 1,
            p: 1
          }}>
            <img 
              src={selectedImage.preview} 
              alt={`画像 ${currentImageIndex + 1}`}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '500px', 
                objectFit: 'contain'
              }}
            />
          </Box>
          
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">
              {currentImageIndex + 1}. {selectedImage.name || '画像'}
            </Typography>
            
            <Box>
              <Tooltip title="画像を複製">
                <Button 
                  startIcon={<ContentCopyIcon />} 
                  onClick={() => duplicateImage(currentImageIndex)}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  複製
                </Button>
              </Tooltip>
              
              <Tooltip title="画像を削除">
                <Button 
                  startIcon={<DeleteIcon />} 
                  color="error"
                  onClick={() => deleteImage(currentImageIndex)}
                  disabled={images.length <= 1}
                  size="small"
                >
                  削除
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Divider sx={{ my: 2 }} />

      {/* 順序変更部分 */}
      <Paper sx={{ width: '100%', p: 2 }}>
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

export default TimeSettings;