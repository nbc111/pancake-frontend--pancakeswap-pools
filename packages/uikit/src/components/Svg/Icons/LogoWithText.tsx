import React from "react";
import Svg from "../Svg";
import { SvgProps } from "../types";
import { vars } from "../../../css/vars.css";

const Logo: React.FC<React.PropsWithChildren<SvgProps>> = (props) => {
  return (
    <Svg viewBox="0 0 1281 199" {...props}>
      {/* NBC Cake图标 */}
      <image
        href="/images/nbccake.svg"
        x="0"
        y="0"
        width="199"
        height="199"
        preserveAspectRatio="xMidYMid meet"
      />
      {/* NbcSwap文字部分 - 使用文本元素 */}
      <text
        x="250"
        y="120"
        fontSize="150"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        fill={vars.colors.contrast}
        textAnchor="start"
        dominantBaseline="middle"
      >
        NbcSwap
      </text>
    </Svg>
  );
};

export default Logo;
