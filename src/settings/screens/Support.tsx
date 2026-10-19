import QRCode from 'qrcode';
import { useEffect, useRef, useState } from 'react';
import { api } from '../../shared/api';
import { Card, PetPreview } from '../ui';

export const REVOLUT_HANDLE = '@vallentes';
export const REVOLUT_URL = 'https://revolut.me/vallentes';

const BANK = [
  { label: 'Beneficiary', value: 'Valentin Vina' },
  { label: 'IBAN', value: 'RO28 REVO 0000 1988 0630 1331' },
  { label: 'BIC / SWIFT', value: 'REVOROBB' },
  { label: 'Currency', value: 'RON (Romanian Leu)' },
];

function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn small secondary"
      onClick={() =>
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        })
      }
    >
      {copied ? 'Copied' : label}
    </button>
  );
}

/** QR code for the Revolut payment link, generated locally. */
function RevolutQr() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) {
      void QRCode.toCanvas(ref.current, REVOLUT_URL, {
        width: 168,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#191c1f', light: '#ffffff' },
      });
    }
  }, []);
  return <canvas ref={ref} aria-label={`QR code for ${REVOLUT_URL}`} role="img" style={{ borderRadius: 12, border: '3px solid var(--line)' }} />;
}

export function SupportScreen() {
  const [bank, setBank] = useState(false);
  return (
    <>
      <h1>Support PixelBuddy</h1>
      <p className="lead">PixelBuddy is free. No trials, no ads, no tracking. Just pets.</p>
      <Card>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <PetPreview species="mochi" state="eat" scale={3} label="Mochi enjoying a snack" />
          <div className="stack" style={{ flex: 1 }}>
            <h2 style={{ margin: 0 }}>I turn coffee into code. Sometimes the code even works.</h2>
            <p className="muted" style={{ margin: 0 }}>
              If PixelBuddy made you smile, kept you company, or stopped you from throwing your computer out the window, consider
              buying me a coffee. It keeps the pets fed and the bugs (mostly) under control.
            </p>
            <div className="actions">
              <button className="btn big" onClick={() => api.openSupportLink('coffee')}>☕ Buy me a coffee</button>
            </div>
            <span className="muted" style={{ fontSize: 12.5 }}>Opens buymeacoffee.com/vallentes in your browser.</span>
          </div>
        </div>
      </Card>
      <Card title="Tip with Revolut">
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <RevolutQr />
          <div className="stack" style={{ flex: 1, minWidth: 220 }}>
            <div>
              <div className="muted" style={{ fontSize: 12.5 }}>Revolut</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <b style={{ fontSize: 22 }}>{REVOLUT_HANDLE}</b>
                <CopyButton value={REVOLUT_HANDLE} />
              </div>
            </div>
            <p className="muted" style={{ margin: 0 }}>
              Scan with your phone camera or open the link. You can pay with Revolut, any debit or credit card, or Apple Pay. No
              Revolut account needed.
            </p>
            <div className="actions">
              <button className="btn" onClick={() => api.openSupportLink('revolut')}>Open revolut.me/vallentes</button>
              <CopyButton value={REVOLUT_URL} label="Copy link" />
            </div>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <button className="btn small secondary" aria-expanded={bank} onClick={() => setBank((b) => !b)}>
            {bank ? 'Hide bank details' : 'Prefer a bank transfer?'}
          </button>
          {bank && (
            <div style={{ marginTop: 8 }}>
              {BANK.map((b) => (
                <div className="device" key={b.label}>
                  <div>
                    <div className="muted" style={{ fontSize: 12.5 }}>{b.label}</div>
                    <b className="mono" style={{ userSelect: 'text' }}>{b.value}</b>
                  </div>
                  <CopyButton value={b.label === 'IBAN' ? b.value.replace(/\s/g, '') : b.value} />
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
