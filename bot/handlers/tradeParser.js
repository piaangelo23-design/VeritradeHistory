const DEFAULT_PARSER = {
  headerPattern: 'TRADE COMPLETED',
  fields: {
    buyer: 'Buyer:',
    seller: 'Seller:',
    value: 'Value:',
    status: 'Status:',
    middleman: 'Middleman:'
  }
};

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractField(content, label) {
  const regex = new RegExp(`^${escapeRegex(label)}\\s*(.+)$`, 'im');
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

function extractItemBlocks(content, buyer, seller) {
  const buyerBlockRegex = new RegExp(`${escapeRegex(buyer)}\\s*gave:\\s*([\\s\\S]*?)(?=\\n\\s*${escapeRegex(seller)}\\s*gave:|\\nValue:|$)`, 'i');
  const sellerBlockRegex = new RegExp(`${escapeRegex(seller)}\\s*gave:\\s*([\\s\\S]*?)(?=\\nValue:|\\nStatus:|\\nMiddleman:|$)`, 'i');
  const buyerMatch = content.match(buyerBlockRegex);
  const sellerMatch = content.match(sellerBlockRegex);
  const clean = (text) => (text || '').replace(/^[\s:-]+/, '').trim().split('\n')[0].trim();
  return {
    buyerItem: clean(buyerMatch?.[1]),
    sellerItem: clean(sellerMatch?.[1])
  };
}

function parseTradeMessage(content, parserConfig = DEFAULT_PARSER) {
  const parser = { ...DEFAULT_PARSER, ...parserConfig, fields: { ...DEFAULT_PARSER.fields, ...(parserConfig?.fields || {}) } };
  const normalized = content.replace(/\r/g, '').trim();

  if (!normalized.toUpperCase().includes(parser.headerPattern.toUpperCase())) {
    return null;
  }

  const buyer = extractField(normalized, parser.fields.buyer);
  const seller = extractField(normalized, parser.fields.seller);
  const valueRaw = extractField(normalized, parser.fields.value);
  const status = extractField(normalized, parser.fields.status) || 'Completed';
  const middlemanRaw = extractField(normalized, parser.fields.middleman);
  const paymentMatch = normalized.match(/(?:payment|paid|robux|money)\s*:\s*\$?([\d,._]+)\s*(robux|rbx|money|usd|dollars?)?/i);
  const paymentAmount = paymentMatch ? Number(paymentMatch[1].replace(/[,_\s]/g, '')) : null;
  const paymentType = paymentMatch?.[2]?.toLowerCase().match(/robux|rbx/) ? 'robux' : paymentMatch ? 'money' : null;
  const effectiveValueRaw = valueRaw || (paymentAmount !== null ? String(paymentAmount) : null);

  if (!buyer || !seller || !effectiveValueRaw) return null;

  const { buyerItem, sellerItem } = extractItemBlocks(normalized, buyer, seller);
  if (!buyerItem || !sellerItem) return null;

  const value = Number(String(effectiveValueRaw).replace(/[,_\s]/g, ''));
  if (Number.isNaN(value)) return null;

  if (!/completed/i.test(status)) return null;

  let middleman = null;
  if (middlemanRaw) {
    const lower = middlemanRaw.toLowerCase();
    if (!lower.includes('none') && !lower.includes('direct')) {
      middleman = middlemanRaw.trim();
    }
  }

  return {
    buyer,
    seller,
    buyerItem,
    sellerItem,
    value,
    paymentType,
    paymentAmount,
    status,
    middleman
  };
}

module.exports = { parseTradeMessage, DEFAULT_PARSER };
