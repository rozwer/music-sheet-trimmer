import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { 
  Box, 
  Typography,
  Paper
} from '@mui/material';
import FirstImageTrimmer from './FirstImageTrimmer';

const ImageTrimmer = () => {
  const { images } = useAppContext();

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

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        基準画像のトリミング
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 2 }}>
        最初の画像で楽譜のトリミング範囲を指定します。この設定が他の画像にも適用されます。
      </Typography>

      {/* 基準画像のトリミングエリア */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <FirstImageTrimmer 
          image={images[0]} 
          imageIndex={0} 
        />
      </Paper>
    </Box>
  );
};

export default ImageTrimmer;