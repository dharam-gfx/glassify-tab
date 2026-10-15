import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const OPEN_KEY = 'glassify:openSections';

function readOpen() {
    try {
        return JSON.parse( localStorage.getItem( OPEN_KEY ) || '{}' );
    } catch {
        return {};
    }
}

/** Pass `collapsible` to fold long sections; the open/closed choice is remembered per title. */
export function Section( { title, action, summary, collapsible = false, defaultOpen = false, children } ) {
    const [open, setOpen] = useState( () => !collapsible || ( readOpen()[title] ?? defaultOpen ) );

    const toggle = () => {
        const next = !open;
        setOpen( next );
        localStorage.setItem( OPEN_KEY, JSON.stringify( { ...readOpen(), [title]: next } ) );
    };

    return (
        <section className={`studio-section ${collapsible ? 'collapsible' : ''} ${open ? 'open' : ''}`}>
            <div className="flex items-center justify-between gap-2 py-2">
                {collapsible ? (
                    <button type="button" className="section-toggle" onClick={toggle} aria-expanded={open}>
                        <h4>{title}</h4>
                        {!open && summary && <span className="section-summary">{summary}</span>}
                        <ChevronDown size={15} className="section-chevron" />
                    </button>
                ) : (
                    <h4>{title}</h4>
                )}
                {open && action}
            </div>
            {open && <div className="section-body">{children}</div>}
        </section>
    );
}

export function Slider( { label, value, min, max, step = 1, suffix = '', onChange, disabled } ) {
    const pct = ( ( value - min ) / ( max - min ) ) * 100;
    return (
        <div className="py-1">
            <label className={`ctl ${disabled ? 'opacity-40' : ''}`}>
                <span className="ctl-label">{label}</span>
                <span className="flex items-center gap-2">
                    <input
                        type="range"
                        className="range"
                        min={min}
                        max={max}
                        step={step}
                        value={value}
                        disabled={disabled}
                        style={{ '--p': `${pct}%` }}
                        onChange={( e ) => onChange( Number( e.target.value ) )}
                    />
                    <span className="ctl-value">
                        {value}
                        {suffix}
                    </span>
                </span>
            </label>
        </div>
    );
}

export function Segmented( { label, options, value, onChange } ) {
    return (
        <div className="ctl py-1">
            {label && <span className="ctl-label">{label}</span>}
            <div className="seg" role="group" aria-label={label}>
                {options.map( ( opt ) => (
                    <button key={opt.value} type="button" aria-pressed={value === opt.value} onClick={() => onChange( opt.value )}>
                        {opt.label}
                    </button>
                ) )}
            </div>
        </div>
    );
}

export function ColorSwatch( { value, onChange, label, active } ) {
    const isHex = /^#[0-9a-f]{6}$/i.test( value );
    return (
        <label className="swatch color-swatch" aria-pressed={active} title="Custom colour">
            <input type="color" value={isHex ? value : '#ffffff'} onChange={( e ) => onChange( e.target.value )} aria-label={label} />
            {active && isHex && <span className="color-swatch-dot" style={{ background: value }} />}
        </label>
    );
}

export function Toggle( { label, checked, onChange } ) {
    return (
        <div className="ctl py-1">
            <span className="ctl-label">{label}</span>
            <button type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={() => onChange( !checked )} />
        </div>
    );
}
