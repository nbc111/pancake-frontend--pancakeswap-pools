import { useTranslation } from "@pancakeswap/localization";

import BigNumber from "bignumber.js";
import { useCallback, useEffect, useState } from "react";
import { styled, useTheme } from "styled-components";
import { getInterestBreakdown } from "@pancakeswap/utils/compoundApyHelpers";
import { formatNumber, getDecimalAmount, getFullDisplayBalance } from "@pancakeswap/utils/formatBalance";
import removeTrailingZeros from "@pancakeswap/utils/removeTrailingZeros";
import getThemeValue from "@pancakeswap/uikit/util/getThemeValue";
import {
  Box,
  AutoRenewIcon,
  BalanceInput,
  Button,
  CalculateIcon,
  Flex,
  IconButton,
  Image,
  Link,
  Skeleton,
  Slider,
  Text,
  RoiCalculatorModal,
  TextProps,
  Modal,
} from "@pancakeswap/uikit";

import PercentageButton from "./PercentageButton";

const StyledLink = styled(Link)`
  width: 100%;
`;

const AnnualRoiContainer = styled(Flex)`
  cursor: pointer;
`;

const AnnualRoiDisplay = styled((props: TextProps) => <Text {...props} />)`
  width: 72px;
  max-width: 72px;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
`;

interface StakeModalProps {
  // Pool attributes
  stakingTokenDecimals: number;
  stakingTokenSymbol: string;
  stakingTokenAddress: string;
  earningTokenPrice: number;
  apr: number;
  stakingLimit: BigNumber;
  earningTokenSymbol: string;
  userDataStakedBalance: BigNumber;
  userDataStakingTokenBalance: BigNumber;
  enableEmergencyWithdraw: boolean;

  stakingTokenBalance: BigNumber;
  stakingTokenPrice: number;
  isRemovingStake?: boolean;
  needEnable?: boolean;
  enablePendingTx?: boolean;
  setAmount?: (value: string) => void;
  onDismiss?: () => void;
  handleEnableApprove?: () => void;
  account: string;
  handleConfirmClick: any;
  pendingTx: boolean;
  imageUrl?: string;
  stakingTokenLogoURI?: string;
  warning?: React.ReactElement;
}

export const StakeModal: React.FC<React.PropsWithChildren<StakeModalProps>> = ({
  stakingTokenDecimals,
  stakingTokenSymbol,
  stakingTokenAddress,
  stakingTokenBalance,
  stakingTokenPrice,
  apr,
  stakingLimit,
  earningTokenPrice,
  earningTokenSymbol,
  userDataStakedBalance,
  userDataStakingTokenBalance,
  enableEmergencyWithdraw,
  isRemovingStake = false,
  needEnable,
  enablePendingTx,
  setAmount,
  onDismiss,
  handleEnableApprove,
  account,
  pendingTx,
  handleConfirmClick,
  imageUrl = "/images/tokens/",
  stakingTokenLogoURI,
  warning,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [stakeAmount, setStakeAmount] = useState("");
  const [hasReachedStakeLimit, setHasReachedStakedLimit] = useState(false);
  const [percent, setPercent] = useState(0);
  const [showRoiCalculator, setShowRoiCalculator] = useState(false);
  const getCalculatedStakingLimit = useCallback(() => {
    if (isRemovingStake) {
      return userDataStakedBalance;
    }
    if (stakingLimit.gt(0)) {
      const stakingLimitLeft = stakingLimit.minus(userDataStakedBalance);
      if (stakingTokenBalance.gt(stakingLimitLeft)) {
        return stakingLimitLeft;
      }
    }
    return stakingTokenBalance;
  }, [userDataStakedBalance, stakingTokenBalance, stakingLimit, isRemovingStake]);
  const fullDecimalStakeAmount = getDecimalAmount(new BigNumber(stakeAmount), stakingTokenDecimals);
  const userNotEnoughToken = isRemovingStake
    ? userDataStakedBalance.lt(fullDecimalStakeAmount)
    : userDataStakingTokenBalance.lt(fullDecimalStakeAmount);

  // 验证输入参数，确保它们是有效数字
  const validApr = typeof apr === 'number' && Number.isFinite(apr) && apr >= 0 ? apr : 0;
  const validEarningTokenPrice = typeof earningTokenPrice === 'number' && Number.isFinite(earningTokenPrice) && earningTokenPrice > 0 ? earningTokenPrice : 1;
  const validStakingTokenPrice = typeof stakingTokenPrice === 'number' && Number.isFinite(stakingTokenPrice) && stakingTokenPrice >= 0 ? stakingTokenPrice : 0;

  // 处理 stakeAmount 为空字符串或无效值的情况
  const stakeAmountNum = stakeAmount && !isNaN(Number(stakeAmount)) && Number(stakeAmount) >= 0 ? Number(stakeAmount) : 0;
  const usdValueStaked = new BigNumber(stakeAmountNum).times(validStakingTokenPrice);
  const formattedUsdValueStaked = !usdValueStaked.isNaN() && usdValueStaked.isFinite() ? formatNumber(usdValueStaked.toNumber()) : '0';
  const validPrincipalInUSD = !usdValueStaked.isNaN() && usdValueStaked.isFinite() && usdValueStaked.gte(0) ? usdValueStaked.toNumber() : 0;

  // 计算 ROI：如果 stakeAmount 为空或为 0，直接返回 0
  let interestBreakdown: number[] = [0, 0, 0, 0, 0]
  let interestEarned: number = 0
  let annualRoi: number = 0
  
  if (stakeAmountNum > 0 && validPrincipalInUSD > 0 && validApr > 0 && validEarningTokenPrice > 0) {
    // 检查 APR 是否过高，可能导致计算溢出
    const isExtremelyHighApr = validApr > 1000000; // APR > 1,000,000%
    
    if (isExtremelyHighApr) {
      // 对于极高的 APR，使用简化计算避免溢出
      // 简化公式：annualRoi = principalInUSD * (apr / 100)
      try {
        interestEarned = validPrincipalInUSD / validEarningTokenPrice * (validApr / 100)
        annualRoi = interestEarned * validEarningTokenPrice
        interestBreakdown = [0, 0, 0, interestEarned, 0] // 只计算1年的值
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[StakeModal] 极高 APR 计算错误:', error)
        interestEarned = 0
        annualRoi = 0
      }
    } else {
      try {
        interestBreakdown = getInterestBreakdown({
          principalInUSD: validPrincipalInUSD,
          apr: validApr,
          earningTokenPrice: validEarningTokenPrice,
        })
        
        // 确保 interestBreakdown[3] 是有效数字
        interestEarned = typeof interestBreakdown[3] === 'number' && Number.isFinite(interestBreakdown[3]) && interestBreakdown[3] >= 0 ? interestBreakdown[3] : 0
        annualRoi = interestEarned * validEarningTokenPrice
        
        // 检查 annualRoi 是否超出合理范围（> 1e15 可能表示溢出）
        if (!Number.isFinite(annualRoi) || annualRoi < 0 || annualRoi > 1e15) {
          // 如果溢出，使用简化计算
          interestEarned = validPrincipalInUSD / validEarningTokenPrice * (validApr / 100)
          annualRoi = interestEarned * validEarningTokenPrice
          // 再次检查简化计算的结果
          if (!Number.isFinite(annualRoi) || annualRoi < 0) {
            interestEarned = 0
            annualRoi = 0
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[StakeModal] ROI 计算错误:', error)
        interestEarned = 0
        annualRoi = 0
      }
    }
  }
  
  // 确保 annualRoi 始终是有效数字（>= 0 且有限）
  if (!Number.isFinite(annualRoi) || annualRoi < 0) {
    annualRoi = 0
  }
  
  const formattedAnnualRoi = formatNumber(annualRoi, annualRoi > 10000 ? 0 : 2, annualRoi > 10000 ? 0 : 2);

  // 开发环境调试日志：验证 ROI 计算
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[StakeModal] ROI 计算调试:', {
      stakeAmount: stakeAmount || '(空)',
      stakeAmountNum,
      validPrincipalInUSD: `$${validPrincipalInUSD.toFixed(2)}`,
      validApr: `${validApr.toFixed(2)}%`,
      validEarningTokenPrice: `$${validEarningTokenPrice.toFixed(2)}`,
      validStakingTokenPrice: `$${validStakingTokenPrice.toFixed(6)}`,
      interestBreakdown: {
        '1天': interestBreakdown[0],
        '7天': interestBreakdown[1],
        '30天': interestBreakdown[2],
        '1年': interestBreakdown[3],
        '5年': interestBreakdown[4],
      },
      interestEarned: `${interestEarned.toFixed(6)} tokens`,
      annualRoi: `$${annualRoi.toFixed(2)}`,
      annualRoi原始值: annualRoi,
      annualRoi是否有效: Number.isFinite(annualRoi) && annualRoi >= 0,
      formattedAnnualRoi: `$${formattedAnnualRoi}`,
      最终显示值: `$${formattedAnnualRoi}`,
    })
  }

  const getTokenLink = stakingTokenAddress ? `/swap?outputCurrency=${stakingTokenAddress}` : "/swap";

  useEffect(() => {
    if (stakingLimit.gt(0) && !isRemovingStake) {
      setHasReachedStakedLimit(fullDecimalStakeAmount.plus(userDataStakedBalance).gt(stakingLimit));
    }
  }, [
    stakeAmount,
    stakingLimit,
    isRemovingStake,
    setHasReachedStakedLimit,
    fullDecimalStakeAmount,
    userDataStakedBalance,
  ]);

  const handleStakeInputChange = (input: string) => {
    if (input) {
      const convertedInput = getDecimalAmount(new BigNumber(input), stakingTokenDecimals);
      const percentage = Math.floor(convertedInput.dividedBy(getCalculatedStakingLimit()).multipliedBy(100).toNumber());
      setPercent(Math.min(percentage, 100));
    } else {
      setPercent(0);
    }
    setStakeAmount(input);
  };

  const handleChangePercent = useCallback(
    (sliderPercent: number) => {
      if (sliderPercent > 0) {
        const percentageOfStakingMax = getCalculatedStakingLimit().dividedBy(100).multipliedBy(sliderPercent);
        const amountToStake = getFullDisplayBalance(percentageOfStakingMax, stakingTokenDecimals, stakingTokenDecimals);

        setStakeAmount(removeTrailingZeros(amountToStake));
      } else {
        setStakeAmount("");
      }
      setPercent(sliderPercent);
    },
    [getCalculatedStakingLimit, stakingTokenDecimals]
  );

  useEffect(() => {
    if (setAmount) {
      setAmount(Number(stakeAmount) > 0 ? stakeAmount : "0");
    }
  }, [setAmount, stakeAmount]);

  if (showRoiCalculator) {
    return (
      <RoiCalculatorModal
        account={account}
        earningTokenPrice={validEarningTokenPrice}
        stakingTokenPrice={validStakingTokenPrice}
        stakingTokenDecimals={stakingTokenDecimals}
        apr={validApr}
        linkLabel={t("Get %symbol%", { symbol: stakingTokenSymbol })}
        linkHref={getTokenLink}
        stakingTokenBalance={userDataStakedBalance.plus(stakingTokenBalance)}
        stakingTokenSymbol={stakingTokenSymbol}
        earningTokenSymbol={earningTokenSymbol}
        onBack={() => setShowRoiCalculator(false)}
        initialValue={stakeAmount}
      />
    );
  }

  return (
    <Modal
      minWidth="346px"
      title={isRemovingStake ? t("Unstake") : t("Stake in Pool")}
      onDismiss={onDismiss}
      headerBackground={getThemeValue(theme, "colors.gradientCardHeader")}
    >
      <Box overflow="hide auto">
        {stakingLimit.gt(0) && !isRemovingStake && (
          <Text color="secondary" bold mb="24px" style={{ textAlign: "center" }} fontSize="16px">
            {t("Max stake for this pool: %amount% %token%", {
              amount: getFullDisplayBalance(stakingLimit, stakingTokenDecimals, 0),
              token: stakingTokenSymbol,
            })}
          </Text>
        )}
        <Flex alignItems="center" justifyContent="space-between" mb="8px">
          <Text bold>{isRemovingStake ? t("Unstake") : t("Stake")}:</Text>
          <Flex alignItems="center" minWidth="70px">
            <Image
              src={stakingTokenLogoURI || `${imageUrl}${stakingTokenAddress}.png`}
              width={24}
              height={24}
              alt={stakingTokenSymbol}
            />
            <Text ml="4px" bold>
              {stakingTokenSymbol}
            </Text>
          </Flex>
        </Flex>
        <BalanceInput
          value={stakeAmount}
          onUserInput={handleStakeInputChange}
          currencyValue={stakingTokenPrice !== 0 && `~${formattedUsdValueStaked || 0} USD`}
          isWarning={hasReachedStakeLimit || userNotEnoughToken}
          decimals={stakingTokenDecimals}
        />
        {hasReachedStakeLimit && (
          <Text color="failure" fontSize="12px" style={{ textAlign: "right" }} mt="4px">
            {t("Maximum total stake: %amount% %token%", {
              amount: getFullDisplayBalance(new BigNumber(stakingLimit), stakingTokenDecimals, 0),
              token: stakingTokenSymbol,
            })}
          </Text>
        )}
        {userNotEnoughToken && (
          <Text color="failure" fontSize="12px" style={{ textAlign: "right" }} mt="4px">
            {t("Insufficient %symbol% balance", {
              symbol: stakingTokenSymbol,
            })}
          </Text>
        )}
        {needEnable && (
          <Text color="failure" textAlign="right" fontSize="12px" mt="8px">
            {t('Insufficient token allowance. Click "Enable" to approve.')}
          </Text>
        )}
        <Text ml="auto" color="textSubtle" fontSize="12px" mb="8px">
          {t("Balance: %balance%", {
            balance: getFullDisplayBalance(
              isRemovingStake ? userDataStakedBalance : stakingTokenBalance,
              stakingTokenDecimals
            ),
          })}
        </Text>
        <Slider
          min={0}
          max={100}
          value={percent}
          onValueChanged={handleChangePercent}
          name="stake"
          valueLabel={`${percent}%`}
          step={1}
        />
        <Flex alignItems="center" justifyContent="space-between" mt="8px">
          <PercentageButton onClick={() => handleChangePercent(25)}>25%</PercentageButton>
          <PercentageButton onClick={() => handleChangePercent(50)}>50%</PercentageButton>
          <PercentageButton onClick={() => handleChangePercent(75)}>75%</PercentageButton>
          <PercentageButton onClick={() => handleChangePercent(100)}>{t("Max.fill-max")}</PercentageButton>
        </Flex>
        {warning}
        {!isRemovingStake && (
          <Flex mt="24px" alignItems="center" justifyContent="space-between">
            <Text mr="8px" color="textSubtle">
              {t("Annual ROI at current rates")}:
            </Text>
            <AnnualRoiContainer
              alignItems="center"
              onClick={() => {
                setShowRoiCalculator(true);
              }}
            >
              <AnnualRoiDisplay>${formattedAnnualRoi}</AnnualRoiDisplay>
              <IconButton variant="text" scale="sm">
                <CalculateIcon color="textSubtle" width="18px" />
              </IconButton>
            </AnnualRoiContainer>
          </Flex>
        )}
        {isRemovingStake && enableEmergencyWithdraw && (
          <Flex maxWidth="346px" mt="24px">
            <Text textAlign="center">
              {t(
                "This pool was misconfigured. Please unstake your tokens from it, emergencyWithdraw method will be used. Your tokens will be returned to your wallet, however rewards will not be harvested."
              )}
            </Text>
          </Flex>
        )}
        {needEnable ? (
          <Button
            width="100%"
            isLoading={enablePendingTx}
            endIcon={enablePendingTx ? <AutoRenewIcon spin color="currentColor" /> : null}
            onClick={handleEnableApprove}
            mt="24px"
            minHeight={48}
          >
            {t("Enable.Approval")}
          </Button>
        ) : (
          <Button
            width="100%"
            isLoading={pendingTx}
            endIcon={pendingTx ? <AutoRenewIcon spin color="currentColor" /> : null}
            onClick={() => handleConfirmClick(stakeAmount)}
            disabled={!stakeAmount || parseFloat(stakeAmount) === 0 || hasReachedStakeLimit || userNotEnoughToken}
            mt="24px"
          >
            {pendingTx ? t("Confirming") : t("Confirm")}
          </Button>
        )}
        {!isRemovingStake && (
          <StyledLink external href={getTokenLink}>
            <Button width="100%" mt="8px" variant="secondary">
              {t("Get %symbol%", { symbol: stakingTokenSymbol })}
            </Button>
          </StyledLink>
        )}
      </Box>
    </Modal>
  );
};
