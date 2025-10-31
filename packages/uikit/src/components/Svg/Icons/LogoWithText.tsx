import React from "react";
import Svg from "../Svg";
import { SvgProps } from "../types";
import { vars } from "../../../css/vars.css";

const Logo: React.FC<React.PropsWithChildren<SvgProps>> = (props) => {
  return (
    <Svg viewBox="0 0 1281 199" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" {...props}>
      {/* 使用本地 Logo 图片替换左侧图标部分 */}
      <image href="/logo.png" x="0" y="0" width="199" height="199" preserveAspectRatio="xMidYMid meet" />
      {/* NbcSwap 文字 - 位置和大小与原始设计保持一致 */}
      <text
        x="220"
        y="135"
        fontSize="140"
        fontWeight="700"
        fill={vars.colors.contrast}
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
        letterSpacing="0.01em"
        style={{ userSelect: "none" }}
      >
        NbcSwap
      </text>
    </Svg>
  );
};

export default Logo;
