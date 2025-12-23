import React from "react";
import Svg from "../Svg";
import { SvgProps } from "../types";
import { vars } from "../../../css/vars.css";

const Logo: React.FC<React.PropsWithChildren<SvgProps>> = (props) => {
  // viewBox 高度为 199，图标高度进一步增大到 145，计算垂直居中位置
  const viewBoxHeight = 199;
  const imageHeight = 145; // 从 130 增加到 145
  const imageWidth = 310; // 从 280 增加到 310，保持宽高比
  const imageY = (viewBoxHeight - imageHeight) / 2; // 垂直居中：27

  // 文字垂直居中：文字的 y 是基线位置，需要调整以匹配图标中心
  // 字体大小 140，考虑基线位置，调整 y 使文字与图标垂直对齐
  const textY = viewBoxHeight / 2 + 40; // 约 139.5，使文字与图标垂直对齐

  return (
    <Svg viewBox="0 0 1281 199" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" {...props}>
      {/* 使用本地 Logo 图片替换左侧图标部分 - 垂直居中，尺寸增大 */}
      <image
        href="/images/mainlogo.svg"
        x="0"
        y={imageY}
        width={imageWidth}
        height={imageHeight}
        preserveAspectRatio="xMidYMid meet"
      />
      {/* NBC Staking 文字 - 垂直居中对齐，位置调整以适应更大的图标 */}
      <text
        x={imageWidth + 20}
        y={textY}
        fontSize="140"
        fontWeight="700"
        fill={vars.colors.contrast}
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
        letterSpacing="0.01em"
        style={{ userSelect: "none" }}
      >
        NBC Staking
      </text>
    </Svg>
  );
};

export default Logo;
