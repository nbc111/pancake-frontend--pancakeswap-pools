import React from "react";
import { styled } from "styled-components";
import Text from "../Text/Text";
import Skeleton from "../Skeleton/Skeleton";
import { Colors } from "../../theme";

export interface Props {
  color?: keyof Colors;
  cakePriceUsd?: number;
  showSkeleton?: boolean;
  chainId: number;
}

const PriceLink = styled.div`
  display: flex;
  align-items: center;
  img {
    transition: transform 0.3s;
  }
  &:hover {
    img {
      transform: scale(1.2);
    }
  }
`;

const IconImage = styled.img`
  width: 24px;
  height: 24px;
  margin-right: 8px;
`;

const CakePrice: React.FC<React.PropsWithChildren<Props>> = ({
  cakePriceUsd,
  color = "textSubtle",
  showSkeleton = true,
  chainId,
}) => {
  return cakePriceUsd ? (
    <PriceLink>
      <IconImage src="/images/custom-tokens/nbc.png" alt="NBC" />
      <Text color={color} bold>{`$${cakePriceUsd.toFixed(3)}`}</Text>
    </PriceLink>
  ) : showSkeleton ? (
    <Skeleton width={80} height={24} />
  ) : null;
};

export default React.memo(CakePrice);
