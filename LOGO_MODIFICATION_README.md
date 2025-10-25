# Logo组件修改说明

## 🎨 Logo组件修改完成

已成功修改PancakeSwap的Logo组件，将原来的SVG兔子图标替换为本地图片文件，并将文字从"PancakeSwap"修改为"NbcSwap"。

### 📁 修改的文件

1. **`packages/uikit/src/components/Svg/Icons/LogoWithText.tsx`** - 主要Logo组件
2. **`packages/uikit/src/components/Svg/Icons/LogoWithLocalImage.tsx`** - 使用SVG图片的版本
3. **`packages/uikit/src/components/Svg/Icons/LogoWithPNG.tsx`** - 使用PNG图片的版本

### 🔄 修改内容

#### 原始版本：
- 使用内嵌的SVG路径绘制兔子图标
- 包含多个路径和颜色定义
- 代码复杂，难以维护

#### 修改后版本：
- 使用 `<image>` 标签引用本地图片文件（NBC Cake图标）
- 使用 `<text>` 元素显示"NbcSwap"文字
- 保持原有的字体样式和颜色
- 支持PNG和SVG两种格式

### 📋 可用的图片文件

1. **`/logo.png`** - 主要的PNG Logo文件
2. **`/images/cake.svg`** - Cake代币的SVG图标
3. **`/images/nbccake.svg`** - NBC Cake的SVG图标

### 🛠️ 使用方法

#### 方法1：使用修改后的LogoWithText组件
```typescript
import LogoWithText from '@pancakeswap/uikit/src/components/Svg/Icons/LogoWithText'

// 组件会自动使用 /images/nbccake.svg 和显示 "NbcSwap" 文字
<LogoWithText width="200" height="40" />
```

#### 方法2：使用专门的PNG版本
```typescript
import LogoWithPNG from '@pancakeswap/uikit/src/components/Svg/Icons/LogoWithPNG'

// 使用 /logo.png
<LogoWithPNG width="200" height="40" />
```

#### 方法3：使用SVG版本
```typescript
import LogoWithLocalImage from '@pancakeswap/uikit/src/components/Svg/Icons/LogoWithLocalImage'

// 使用 /images/cake.svg
<LogoWithLocalImage width="200" height="40" />
```

### 🎯 优势

1. **简化维护** - 不再需要维护复杂的SVG路径
2. **灵活替换** - 可以轻松更换不同的图片文件
3. **性能优化** - 图片文件可以被浏览器缓存
4. **支持多种格式** - 支持PNG、SVG等格式
5. **品牌定制** - 文字已修改为"NbcSwap"，保持品牌一致性

### 🔧 自定义图片

如果需要使用其他图片，只需：

1. 将图片文件放在 `apps/web/public/` 目录下
2. 修改组件中的 `href` 属性
3. 调整 `width` 和 `height` 属性以适应新图片

### 📝 注意事项

- 图片文件必须放在 `public` 目录下才能被正确访问
- SVG图片在缩放时保持清晰度
- PNG图片适合复杂的设计
- 建议图片尺寸为正方形，便于在不同尺寸下显示

### 🚀 下一步

现在Logo组件已经修改完成，你可以：
1. 替换 `apps/web/public/images/nbccake.svg` 为你自己的图标
2. 或者替换 `apps/web/public/logo.png` 为你自己的Logo
3. 修改文字内容（在LogoWithText.tsx中的text元素）
4. 重新构建项目以查看效果
