import { toGhs } from './currency';
import { Order } from './orders-store';

type ReceiptPayload = {
  n: string;
  h: string;
  e: string;
  p: string;
  l: string;
  c: string;
  a: string;
  cu: string;
  rn: string;
  dt: string;
  it: { d: string; q: number; r: number }[];
  da: number;
  tp: number;
  ap: number;
  pt: string;
  mn: string;
  mu: string;
  bn: string;
  ba: string;
  br: 1;
  k: 'receipt';
};

function encodeReceipt(payload: ReceiptPayload): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function getCreatorsKitReceiptUrl(order: Order): string {
  const payload: ReceiptPayload = {
    n: 'Runway',
    h: '@runway',
    e: '',
    p: '',
    l: 'Ghana',
    c: order.customer.fullName,
    a: order.customer.phone || order.customer.email || '',
    cu: 'GHS',
    rn: order.id,
    dt: new Date(order.createdAt).toLocaleDateString('en-GH'),
    it: order.items.map((item) => ({
      d: item.name,
      q: item.quantity,
      r: toGhs(item.price),
    })),
    da: 0,
    tp: 0,
    ap: toGhs(order.total),
    pt: order.paymentMethod,
    mn: '',
    mu: '',
    bn: '',
    ba: '',
    br: 1,
    k: 'receipt',
  };

  return `https://creatorskit.win/receipt?r=${encodeReceipt(payload)}`;
}
