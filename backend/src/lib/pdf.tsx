import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer, Svg, Circle } from '@react-pdf/renderer';
import dayjs from 'dayjs';
import { mriazLogoDataUri } from './logos';

const TEAL = '#1B8FA8';
const NAVY = '#2C3E50';

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: 'Helvetica', color: '#1A1A1A' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logoBox: { width: 140, height: 70, justifyContent: 'center' },
  logoImg: { width: 130, objectFit: 'contain' },
  titleBox: { alignItems: 'flex-end' },
  title: { fontSize: 18, fontWeight: 700, letterSpacing: 0.5 },
  ntn: { fontSize: 9, marginTop: 4 },
  divider: { height: 2, marginTop: 10, marginBottom: 14 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  buyerLabel: { fontSize: 10, marginBottom: 4 },
  buyerName: { fontSize: 12, fontWeight: 700 },
  metaLine: { fontSize: 9, marginTop: 2 },
  rightMeta: { alignItems: 'flex-end' },
  serial: { fontSize: 11, fontWeight: 700, marginTop: 4 },
  table: { marginTop: 6, borderWidth: 1, borderColor: '#D5D5D5' },
  tableHeaderRow: { flexDirection: 'row' },
  tableRow: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#E4E4E4' },
  th: { padding: 5, fontSize: 8, fontWeight: 700, color: '#fff' },
  td: { padding: 5, fontSize: 8.5 },
  colQty: { width: '7%' },
  colUnit: { width: '8%' },
  colName: { width: '22%' },
  colSize: { width: '13%' },
  colRate: { width: '10%', textAlign: 'right' },
  colExcl: { width: '12%', textAlign: 'right' },
  colTaxRate: { width: '8%', textAlign: 'center' },
  colTaxAmt: { width: '10%', textAlign: 'right' },
  colIncl: { width: '10%', textAlign: 'right' },
  totalBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 8, marginTop: 0 },
  totalLabel: { fontSize: 11, fontWeight: 700, color: '#fff' },
  totalValue: { fontSize: 12, fontWeight: 700, color: '#fff' },
  thanks: { marginTop: 18, fontSize: 9.5, fontWeight: 700 },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: '#D5D5D5',
    paddingTop: 10,
  },
  footerCol: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '32%' },
  footerText: { fontSize: 8 },
  poweredBy: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 7,
    color: '#A3A3A3',
    letterSpacing: 0.4,
  },
  letterheadImg: { width: '100%', marginBottom: 12, objectFit: 'contain' },
});

function AbdullahImpexMark({ color }: { color: string }) {
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48">
      <Circle cx="24" cy="24" r="22" stroke={color} strokeWidth={3} fill="none" />
      <Circle cx="20" cy="24" r="22" stroke="#1A1A1A" strokeWidth={3} fill="none" />
    </Svg>
  );
}

interface InvoiceItem {
  product_name: string;
  size: string | null;
  unit: string | null;
  quantity: number;
  rate: number;
  tax_rate: number;
  value_excl_tax: number;
  tax_amount: number;
  value_incl_tax: number;
  sort_order: number;
}

interface InvoiceData {
  serial_number: number;
  invoice_date: string;
  period_start?: string | null;
  period_end?: string | null;
  subtotal: number;
  tax_total: number;
  grand_total: number;
  companies: {
    name: string;
    ntn: string | null;
    strn: string | null;
    address: string | null;
    phone: string | null;
    phone2: string | null;
    email: string | null;
    logo_url?: string | null;
    invoice_letterhead_url?: string | null;
  };
  customers?: {
    name: string;
    ntn: string | null;
    strn: string | null;
    address: string | null;
  } | null;
  invoice_items: InvoiceItem[];
}

function money(n: number) {
  return Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 2 });
}

function InvoiceDocument({ invoice }: { invoice: InvoiceData }) {
  const isMRiaz = invoice.companies.name.toLowerCase().includes('m riaz');
  const accent = isMRiaz ? TEAL : NAVY;
  const items = [...invoice.invoice_items].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {invoice.companies.invoice_letterhead_url ? (
          <Image src={invoice.companies.invoice_letterhead_url} style={styles.letterheadImg} />
        ) : (
          <>
            <View style={styles.headerRow}>
              <View style={styles.logoBox}>
                {invoice.companies.logo_url ? (
                  <Image src={invoice.companies.logo_url} style={styles.logoImg} />
                ) : isMRiaz ? (
                  <Image src={mriazLogoDataUri} style={styles.logoImg} />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <AbdullahImpexMark color={accent} />
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>Abdullah</Text>
                      <Text style={{ fontSize: 16, fontWeight: 700, color: accent }}>Impex</Text>
                    </View>
                  </View>
                )}
              </View>
              <View style={styles.titleBox}>
                <Text style={[styles.title, { color: accent }]}>SALES TAX INVOICE</Text>
                {invoice.companies.ntn ? <Text style={styles.ntn}>NTN : {invoice.companies.ntn}</Text> : null}
                {invoice.companies.strn ? <Text style={styles.ntn}>S.T Reg # : {invoice.companies.strn}</Text> : null}
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: accent }]} />
          </>
        )}

        <View style={styles.metaRow}>
          <View style={{ maxWidth: '60%' }}>
            <Text style={styles.buyerLabel}>Buyer Name :</Text>
            <Text style={styles.buyerName}>{invoice.customers?.name ?? 'Walk-in Customer'}</Text>
            {invoice.customers?.ntn ? (
              <Text style={styles.metaLine}>N.T.N : {invoice.customers.ntn}</Text>
            ) : null}
            {invoice.customers?.strn ? (
              <Text style={styles.metaLine}>S.T Registration # : {invoice.customers.strn}</Text>
            ) : null}
            {invoice.customers?.address ? (
              <Text style={styles.metaLine}>Address : {invoice.customers.address}</Text>
            ) : null}
          </View>
          <View style={styles.rightMeta}>
            <Text style={styles.metaLine}>Date : {dayjs(invoice.invoice_date).format('D MMMM, YYYY')}</Text>
            {invoice.period_start && invoice.period_end ? (
              <Text style={styles.metaLine}>
                Period : {dayjs(invoice.period_start).format('D MMM YYYY')} – {dayjs(invoice.period_end).format('D MMM YYYY')}
              </Text>
            ) : null}
            <Text style={styles.serial}>Serial Number : {invoice.serial_number}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableHeaderRow, { backgroundColor: accent }]}>
            <Text style={[styles.th, styles.colQty]}>QTY</Text>
            <Text style={[styles.th, styles.colUnit]}>UNIT</Text>
            <Text style={[styles.th, styles.colName]}>PRODUCT NAME</Text>
            <Text style={[styles.th, styles.colSize]}>SIZE</Text>
            <Text style={[styles.th, styles.colRate]}>RATE</Text>
            <Text style={[styles.th, styles.colExcl]}>VALUE EXCL. S.T</Text>
            <Text style={[styles.th, styles.colTaxRate]}>RATE OF S.T</Text>
            <Text style={[styles.th, styles.colTaxAmt]}>TOTAL S.T PAYABLE</Text>
            <Text style={[styles.th, styles.colIncl]}>VALUE INCL. S.T</Text>
          </View>
          {items.map((item, idx) => (
            <View style={styles.tableRow} key={idx}>
              <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.td, styles.colUnit]}>{item.unit}</Text>
              <Text style={[styles.td, styles.colName]}>{item.product_name}</Text>
              <Text style={[styles.td, styles.colSize]}>{item.size}</Text>
              <Text style={[styles.td, styles.colRate]}>{money(item.rate)}</Text>
              <Text style={[styles.td, styles.colExcl]}>{money(item.value_excl_tax)}</Text>
              <Text style={[styles.td, styles.colTaxRate]}>{item.tax_rate ? `${item.tax_rate}%` : '-'}</Text>
              <Text style={[styles.td, styles.colTaxAmt]}>{item.tax_amount ? money(item.tax_amount) : '-'}</Text>
              <Text style={[styles.td, styles.colIncl]}>{money(item.value_incl_tax)}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.totalBar, { backgroundColor: accent }]}>
          <Text style={styles.totalLabel}>GRAND TOTAL :</Text>
          <Text style={styles.totalValue}>Rs. {money(invoice.grand_total)}</Text>
        </View>

        <Text style={styles.thanks}>Thank you for doing business with us!</Text>

        <View style={styles.footer}>
          <View style={styles.footerCol}>
            <Text style={styles.footerText}>
              {invoice.companies.phone}
              {invoice.companies.phone2 ? `  /  ${invoice.companies.phone2}` : ''}
            </Text>
          </View>
          <View style={styles.footerCol}>
            <Text style={styles.footerText}>{invoice.companies.email}</Text>
          </View>
          <View style={styles.footerCol}>
            <Text style={styles.footerText}>{invoice.companies.address}</Text>
          </View>
        </View>

        <Text style={styles.poweredBy} fixed>
          Powered by Quantum Solutions Group
        </Text>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(invoice: InvoiceData): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument invoice={invoice} />);
}

// =====================================================================
// Monthly ledger — a running statement of a customer's or supplier's
// activity within a date range, with a starting balance and a running
// total after each line, ending in a closing balance. Printable A4.
// =====================================================================

const ledgerStyles = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: 'Helvetica', color: '#1A1A1A' },
  title: { fontSize: 16, fontWeight: 700 },
  subtitle: { fontSize: 10, marginTop: 4, color: '#5C5C5C' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 14 },
  metaLine: { fontSize: 9, marginTop: 2 },
  table: { borderWidth: 1, borderColor: '#D5D5D5' },
  headerRow: { flexDirection: 'row', backgroundColor: '#121110' },
  th: { padding: 6, fontSize: 8, fontWeight: 700, color: '#fff' },
  row: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#E4E4E4' },
  rowAlt: { backgroundColor: '#FAF8F4' },
  td: { padding: 6, fontSize: 8.5 },
  colDate: { width: '12%' },
  colType: { width: '14%' },
  colDesc: { width: '34%' },
  colDebit: { width: '13%', textAlign: 'right' },
  colCredit: { width: '13%', textAlign: 'right' },
  colBalance: { width: '14%', textAlign: 'right' },
  totalsRow: { flexDirection: 'row', backgroundColor: '#F2EDE4', borderTopWidth: 1.5, borderColor: '#121110' },
  poweredBy: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 7,
    color: '#A3A3A3',
    letterSpacing: 0.4,
  },
});

export interface LedgerEntry {
  date: string;
  type: string; // 'Sale', 'Purchase', 'Invoice'
  description: string;
  debit: number; // increases what the party owes us (sale) or what we owe them decreases
  credit: number;
}

export interface LedgerData {
  partyName: string;
  partyType: 'Customer' | 'Supplier';
  periodStart: string;
  periodEnd: string;
  openingBalance: number;
  entries: LedgerEntry[];
}

function LedgerDocument({ ledger }: { ledger: LedgerData }) {
  let running = ledger.openingBalance;
  const rows = ledger.entries.map((e) => {
    running = running + e.debit - e.credit;
    return { ...e, balance: running };
  });
  const totalDebit = ledger.entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = ledger.entries.reduce((s, e) => s + e.credit, 0);

  return (
    <Document>
      <Page size="A4" style={ledgerStyles.page}>
        <Text style={ledgerStyles.title}>Monthly Ledger — {ledger.partyName}</Text>
        <Text style={ledgerStyles.subtitle}>
          {ledger.partyType} statement · {dayjs(ledger.periodStart).format('D MMM YYYY')} to{' '}
          {dayjs(ledger.periodEnd).format('D MMM YYYY')}
        </Text>

        <View style={ledgerStyles.metaRow}>
          <Text style={ledgerStyles.metaLine}>Opening balance: Rs. {money(ledger.openingBalance)}</Text>
          <Text style={ledgerStyles.metaLine}>Closing balance: Rs. {money(running)}</Text>
        </View>

        <View style={ledgerStyles.table}>
          <View style={ledgerStyles.headerRow}>
            <Text style={[ledgerStyles.th, ledgerStyles.colDate]}>DATE</Text>
            <Text style={[ledgerStyles.th, ledgerStyles.colType]}>TYPE</Text>
            <Text style={[ledgerStyles.th, ledgerStyles.colDesc]}>DESCRIPTION</Text>
            <Text style={[ledgerStyles.th, ledgerStyles.colDebit]}>DEBIT</Text>
            <Text style={[ledgerStyles.th, ledgerStyles.colCredit]}>CREDIT</Text>
            <Text style={[ledgerStyles.th, ledgerStyles.colBalance]}>BALANCE</Text>
          </View>
          {rows.map((r, idx) => (
            <View style={[ledgerStyles.row, idx % 2 === 1 ? ledgerStyles.rowAlt : {}]} key={idx}>
              <Text style={[ledgerStyles.td, ledgerStyles.colDate]}>{dayjs(r.date).format('D MMM')}</Text>
              <Text style={[ledgerStyles.td, ledgerStyles.colType]}>{r.type}</Text>
              <Text style={[ledgerStyles.td, ledgerStyles.colDesc]}>{r.description}</Text>
              <Text style={[ledgerStyles.td, ledgerStyles.colDebit]}>{r.debit ? money(r.debit) : '-'}</Text>
              <Text style={[ledgerStyles.td, ledgerStyles.colCredit]}>{r.credit ? money(r.credit) : '-'}</Text>
              <Text style={[ledgerStyles.td, ledgerStyles.colBalance]}>{money(r.balance)}</Text>
            </View>
          ))}
          <View style={ledgerStyles.totalsRow}>
            <Text style={[ledgerStyles.td, { width: '60%', fontWeight: 700 }]}>Totals</Text>
            <Text style={[ledgerStyles.td, ledgerStyles.colDebit, { fontWeight: 700 }]}>{money(totalDebit)}</Text>
            <Text style={[ledgerStyles.td, ledgerStyles.colCredit, { fontWeight: 700 }]}>{money(totalCredit)}</Text>
            <Text style={[ledgerStyles.td, ledgerStyles.colBalance, { fontWeight: 700 }]}>{money(running)}</Text>
          </View>
        </View>

        <Text style={ledgerStyles.poweredBy} fixed>
          Powered by Quantum Solutions Group
        </Text>
      </Page>
    </Document>
  );
}

export async function renderLedgerPdf(ledger: LedgerData): Promise<Buffer> {
  return renderToBuffer(<LedgerDocument ledger={ledger} />);
}
