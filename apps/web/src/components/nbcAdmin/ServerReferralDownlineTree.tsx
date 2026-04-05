import React from 'react'
import { Box, Text } from '@pancakeswap/uikit'
import type { ReferralDownlineTreeNode } from 'types/referralServerGraph'

const Row: React.FC<{ node: ReferralDownlineTreeNode; depth: number }> = ({ node, depth }) => (
  <Box pl={`${depth * 18}px`} mb="8px">
    <Box
      p="10px 12px"
      style={{
        display: 'inline-block',
        maxWidth: '100%',
        border: '1px solid var(--colors-cardBorder)',
        borderRadius: 8,
        background: 'var(--colors-backgroundAlt)',
      }}
    >
      <Text fontFamily="monospace" fontSize="13px" style={{ wordBreak: 'break-all' }}>
        {node.address}
      </Text>
    </Box>
    {node.children.map((ch) => (
      <Row key={ch.address} node={ch} depth={depth + 1} />
    ))}
  </Box>
)

/** 服务端 downlineTree：以查询地址为根，展开直推子树（最多三级） */
export const ServerReferralDownlineTree: React.FC<{ root: ReferralDownlineTreeNode }> = ({ root }) => {
  return (
    <Box>
      <Row node={root} depth={0} />
    </Box>
  )
}
