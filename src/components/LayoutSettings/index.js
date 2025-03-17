import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { 
  Box, Typography, Paper, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio,
  Select, MenuItem, TextField, InputLabel, Grid, Divider
} from '@mui/material';

// 用紙サイズ定義 (mm単位)
const paperSizes = {
  a3: { width: 297, height: 420 },
  a4: { width: 210, height: 297 },
  a5: { width: 148, height: 210 }
};

const LayoutSettings = () => {
  const { images, layoutSettings, setLayoutSettings } = useAppContext();
  
  // 用紙サイズ変更
  const handleSizeChange = (event) => {
    setLayoutSettings({
      ...layoutSettings,
      outputSize: event.target.value,
      customSize: event.target.value === 'custom' ? layoutSettings.customSize : { width: 0, height: 0 }
    });
  };
  
  // 向き変更
  const handleOrientationChange = (event) => {
    setLayoutSettings({
      ...layoutSettings,
      orientation: event.target.value
    });
  };
  
  // 列数変更
  const handleColumnsChange = (event) => {
    setLayoutSettings({
      ...layoutSettings,
      columns: parseInt(event.target.value)
    });
  };
  
  // 配置方向変更
  const handleDirectionChange = (event) => {
    setLayoutSettings({
      ...layoutSettings,
      direction: event.target.value
    });
  };
  
  // 間隔変更
  const handleSpacingChange = (event) => {
    setLayoutSettings({
      ...layoutSettings,
      spacing: event.target.value
    });
  };
  
  // カスタムサイズ変更
  const handleCustomSizeChange = (dimension, value) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setLayoutSettings({
      ...layoutSettings,
      customSize: {
        ...layoutSettings.customSize,
        [dimension]: numValue
      }
    });
  };

  // タイトル情報の変更
  const handleTitleInfoChange = (field, value) => {
    setLayoutSettings({
      ...layoutSettings,
      titleInfo: {
        ...(layoutSettings.titleInfo || {}),
        [field]: value
      }
    });
  };

  // 画像がなければ案内メッセージを表示
  if (images.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Typography variant="h6" color="text.secondary">
          レイアウトする画像がありません。前のステップに戻って画像をアップロードしてください。
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        レイアウト設定
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              出力サイズと向き
            </Typography>
            
            <FormControl fullWidth margin="normal">
              <FormLabel>用紙サイズ</FormLabel>
              <RadioGroup
                row
                name="outputSize"
                value={layoutSettings.outputSize}
                onChange={handleSizeChange}
              >
                <FormControlLabel value="a3" control={<Radio />} label="A3" />
                <FormControlLabel value="a4" control={<Radio />} label="A4" />
                <FormControlLabel value="a5" control={<Radio />} label="A5" />
                <FormControlLabel value="infinite" control={<Radio />} label="無限長" />
                <FormControlLabel value="custom" control={<Radio />} label="カスタム" />
              </RadioGroup>
            </FormControl>

            {layoutSettings.outputSize === 'custom' && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  label="幅 (mm)"
                  type="number"
                  value={layoutSettings.customSize.width}
                  onChange={(e) => handleCustomSizeChange('width', e.target.value)}
                  inputProps={{ min: 1 }}
                  size="small"
                />
                <Typography>×</Typography>
                <TextField
                  label="高さ (mm)"
                  type="number"
                  value={layoutSettings.customSize.height}
                  onChange={(e) => handleCustomSizeChange('height', e.target.value)}
                  inputProps={{ min: 1 }}
                  size="small"
                />
              </Box>
            )}
            
            {layoutSettings.outputSize !== 'infinite' && (
              <FormControl fullWidth margin="normal">
                <FormLabel>向き</FormLabel>
                <RadioGroup
                  row
                  name="orientation"
                  value={layoutSettings.orientation}
                  onChange={handleOrientationChange}
                >
                  <FormControlLabel value="portrait" control={<Radio />} label="縦向き" />
                  <FormControlLabel value="landscape" control={<Radio />} label="横向き" />
                </RadioGroup>
              </FormControl>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              レイアウト設定
            </Typography>
            
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel>列数</InputLabel>
              <Select
                value={layoutSettings.columns}
                label="列数"
                onChange={handleColumnsChange}
              >
                <MenuItem value={1}>1列</MenuItem>
                <MenuItem value={2}>2列</MenuItem>
                <MenuItem value={3}>3列</MenuItem>
                <MenuItem value={4}>4列</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <FormLabel>配置方向</FormLabel>
              <RadioGroup
                row
                name="direction"
                value={layoutSettings.direction}
                onChange={handleDirectionChange}
              >
                <FormControlLabel value="horizontal" control={<Radio />} label="横優先（左→右）" />
                
              </RadioGroup>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>画像間隔</InputLabel>
              <Select
                value={layoutSettings.spacing}
                label="画像間隔"
                onChange={handleSpacingChange}
                size="small"
              >
                <MenuItem value="0">なし</MenuItem>
                <MenuItem value="1/16">1/16</MenuItem>
                <MenuItem value="1/8">1/8</MenuItem>
                <MenuItem value="1/4">1/4</MenuItem>
                <MenuItem value="custom">カスタム</MenuItem>
              </Select>
            </FormControl>
            
            {layoutSettings.spacing === 'custom' && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  label="間隔 (ピクセル)"
                  type="number"
                  value={layoutSettings.customSpacing || 10}
                  onChange={(e) => setLayoutSettings({
                    ...layoutSettings,
                    customSpacing: parseInt(e.target.value)
                  })}
                  inputProps={{ min: 0 }}
                  size="small"
                />
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, overflow: 'auto', height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              タイトル情報
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              PDFに表示されるタイトルを設定できます
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="タイトル"
                variant="outlined"
                margin="normal"
                value={(layoutSettings.titleInfo?.title || '')}
                onChange={(e) => handleTitleInfoChange('title', e.target.value)}
                placeholder="曲のタイトルや作品名"
              />
            </Box>
            
            <Typography variant="body2" sx={{ mt: 2 }}>
              画像数: {images.length}枚
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LayoutSettings;