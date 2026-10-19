import { useEffect, useRef, type ReactNode } from 'react';
import { drawText, measure } from '../sprites/font';
import { FrameLoop } from '../engine/motion';
import { createRenderer, type ArtStyle, type Renderer } from '../shared/renderer';
import type { Accessory, ColorVariant, PetState } from '../sprites/types';
import { useStore } from './store';

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`toggle ${on ? 'on' : ''}`}
      onClick={() => onChange(!on)}
    />
  );
}

export function Row({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="row">
      <div>
        <div className="label">{label}</div>
        {hint && <div className="hint">{hint}</div>}
      </div>
      <div className="control">{children}</div>
    </div>
  );
}

export function Slider(props: {
  value: number;
  min: number;
  max: number;
  step: number;
  label: string;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <>
      <input
        type="range"
        aria-label={props.label}
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
      <span className="value">{props.format ? props.format(props.value) : props.value}</span>
    </>
  );
}

export function Card({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className ?? ''}`}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}

/** Live animated pet preview, same renderer as the desktop pets. */
export function PetPreview(props: {
  species: string;
  color?: ColorVariant;
  accessory?: Accessory;
  state?: PetState;
  scale?: number;
  label?: string;
  bubble?: string | null;
  style?: ArtStyle;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const spriteRef = useRef<Renderer | null>(null);
  const style = props.style ?? useStore().boot.settings.artStyle;
  const scale = props.scale ?? 3;
  const size = 32 * scale + 16;

  useEffect(() => {
    spriteRef.current = createRenderer(style, props.species, props.color ?? 'classic', props.accessory ?? 'none');
  }, [props.species, props.color, props.accessory, style]);

  useEffect(() => {
    if (props.bubble && spriteRef.current) spriteRef.current.say(props.bubble, 1600);
  }, [props.bubble]);

  useEffect(() => {
    const canvas = ref.current!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    const ctx = canvas.getContext('2d')!;
    const loop = new FrameLoop(
      () => (style === 'hd' ? 30 : 12),
      (dt) => {
        const s = spriteRef.current;
        if (!s) return;
        s.setState(props.state ?? 'idle');
        s.advance(dt * 1000, 1);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        s.draw(ctx, canvas.width / 2, canvas.height - 4 * dpr, Math.max(1, Math.round(scale * dpr)));
      },
    );
    loop.start();
    return () => loop.stop();
  }, [props.state, scale, size, style]);

  return <canvas ref={ref} className="pixel preview" style={{ width: size, height: size }} aria-label={props.label ?? 'Pet preview'} />;
}

/** Pixel-font wordmark rendered from the app's own bitmap font. */
export function Wordmark({ text = 'PIXELBUDDY', px = 2 }: { text?: string; px?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const w = (measure(text) + 2) * px;
  const h = 9 * px;
  useEffect(() => {
    const c = ref.current!;
    const dpr = window.devicePixelRatio || 1;
    c.width = w * dpr;
    c.height = h * dpr;
    const ctx = c.getContext('2d')!;
    const p = px * dpr;
    drawText(ctx, text, 2 * p, 2 * p, p, '#ffcf4a');
    drawText(ctx, text, p, p, p, getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#2a2240');
  });
  return <canvas ref={ref} className="pixel" style={{ width: w, height: h }} aria-label={text} role="img" />;
}

export function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="bar" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}
