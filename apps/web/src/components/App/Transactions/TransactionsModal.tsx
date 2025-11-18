import { useTranslation } from '@pancakeswap/localization'
import { Box, Button, FlexGap, InjectedModalProps, Modal, ModalBody, SwapLoading, Text } from '@pancakeswap/uikit'
import { TransactionList } from '@pancakeswap/widgets-internal'
import { useCallback, useMemo } from 'react'
import { useAppDispatch } from 'state'
import { useAMMSortedRecentTransactions } from 'state/transactions/hooks'

import { clearAllTransactions } from 'state/transactions/actions'
import useAccountActiveChain from 'hooks/useAccountActiveChain'
import ConnectWalletButton from '../../ConnectWalletButton'
import { AutoRow } from '../../Layout/Row'
import Transaction from './Transaction'

type AmmTransactionItem = {
  chainId: number
  addedTime: number
  hash: string
  item: ReturnType<typeof useAMMSortedRecentTransactions>[number]
}

export function RecentTransactions() {
  const { account } = useAccountActiveChain()

  const dispatch = useAppDispatch()

  const sortedRecentTransactions = useAMMSortedRecentTransactions()
  const ammTransactions: AmmTransactionItem[] = useMemo(
    () =>
      Object.entries(sortedRecentTransactions).flatMap(([chainId, transactions]) => {
        return Object.values(transactions).map((transaction) => ({
          item: transaction,
          hash: transaction.hash,
          addedTime: transaction.addedTime,
          chainId: Number(chainId),
        }))
      }),
    [sortedRecentTransactions],
  )

  const { t } = useTranslation()

  const hasTransactions = ammTransactions.length > 0

  const clearAllTransactionsCallback = useCallback(() => {
    dispatch(clearAllTransactions())
  }, [dispatch])

  const recentTransactionsHeading = useMemo(() => {
    return (
      <FlexGap alignItems="center" gap="8px">
        <Text color="secondary" fontSize="12px" textTransform="uppercase" bold>
          {t('Recent Transactions')}
        </Text>
        <SwapLoading display={hasTransactions ? 'inline-flex' : 'none'} />
      </FlexGap>
    )
  }, [t, hasTransactions])

  return (
    <Box onClick={(e) => e.stopPropagation()}>
      {account ? (
        hasTransactions ? (
          <>
            <AutoRow mb="1rem" style={{ justifyContent: 'space-between' }}>
              {recentTransactionsHeading}
              {hasTransactions && (
                <Button variant="tertiary" scale="xs" onClick={clearAllTransactionsCallback}>
                  {t('clear')}
                </Button>
              )}
            </AutoRow>

            <TransactionList>
              {ammTransactions
                .slice()
                .sort((a, b) => b.addedTime - a.addedTime)
                .map((tx) => (
                  <Transaction key={tx.hash + tx.addedTime} tx={tx.item} chainId={tx.chainId} />
                ))}
            </TransactionList>
          </>
        ) : (
          <>
            {recentTransactionsHeading}
            <Text mt="8px">{t('No recent transactions')}</Text>
          </>
        )
      ) : (
        <ConnectWalletButton />
      )}
    </Box>
  )
}

const TransactionsModal: React.FC<React.PropsWithChildren<InjectedModalProps>> = ({ onDismiss }) => {
  const { t } = useTranslation()

  return (
    <Modal title={t('Recent Transactions')} headerBackground="gradientCardHeader" onDismiss={onDismiss}>
      <ModalBody>
        <RecentTransactions />
      </ModalBody>
    </Modal>
  )
}

export default TransactionsModal
