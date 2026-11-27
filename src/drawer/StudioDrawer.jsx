import { ChevronDown, Clock3, Download, Eye, ImageUp, LayoutGrid, Plus, RotateCcw, SlidersHorizontal, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { readImage } from '../lib/image';
import { WALLPAPERS, WALLPAPER_GROUPS } from '../lib/wallpapers';
import { PRESETS, SPACING_PRESETS, TILE_BGS } from '../state/defaults';
import { useStore } from '../state/store';
import { ColorSwatch, Section, Segmented, Slider, Toggle } from './controls';
import GithubTokenSetting from './GithubTokenSetting';
import PresetPreview from './PresetPreview';
import { WALLPAPER_KEY, WP_THUMB_KEY, loadImage, storage, writeLocal } from '../state/storage';
import { WIDGET_CATALOG, WIDGET_CATEGORIES } from '../widgets/catalog';
import { PERSONAS } from '../lib/quotes';
import { FONTS, fontAssets } from '../lib/fonts';

// Previews need every face declared, but only while the drawer is open so closed tabs never fetch them.
const PREVIEW_FONT_CSS = FONTS.map( ( f ) => fontAssets( f.id ).css ).join( '' );
import { CLOCK_STYLES, PREVIEW_IDLE_EVENT } from '../components/IdleOverlay';

const CLOCK_TIME_ZONES = Intl.supportedValuesOf?.( 'timeZone' ) ?? ['America/New_York', 'Europe/London', 'Asia/Tokyo'];
const clockCity = ( zone ) => zone.split( '/' ).at( -1 ).replaceAll( '_', ' ' );

const GRID_TYPES = ['bento', 'ordered', 'fluid', 'custom'].map( ( v ) => ( {
    value: v,
    label: v[0].toUpperCase() + v.slice( 1 ),
} ) );
const GRID_HINTS = {
    bento: 'Fixed columns; small items fill gaps around widgets.',
    ordered: 'Fixed columns; everything stays in your order.',
    fluid: 'Columns adapt to the window width.',
    custom: 'Choose exactly how many columns to use.',
};
const LABEL_MODES = [
    { value: 'all', label: 'All' },
    { value: 'hover', label: 'Hover' },
    { value: 'none', label: 'None' },
];

function TextSetting( { value, onCommit, placeholder, maxLength = 80 } ) {
    const [draft, setDraft] = useState( value );
    useEffect( () => setDraft( value ), [value] );
    const commit = () => draft.trim() !== value && onCommit( draft.trim() );
    return (
        <input
            className="field"
            placeholder={placeholder}
            value={draft}
            maxLength={maxLength}
            onChange={( e ) => setDraft( e.target.value )}
            onBlur={commit}
            onKeyDown={( e ) => e.key === 'Enter' && commit()}
        />
    );
}

function ClockCitySetting( { value, onChange } ) {
    const [draft, setDraft] = useState( value ? clockCity( value ) : '' );
    const hasMatchingZone = CLOCK_TIME_ZONES.some( ( zone ) =>
        zone.toLowerCase() === draft.trim().toLowerCase() || clockCity( zone ).toLowerCase() === draft.trim().toLowerCase()
    );

    useEffect( () => setDraft( value ? clockCity( value ) : '' ), [value] );

    const onInput = ( input ) => {
        setDraft( input );
        const query = input.trim().toLowerCase();
        const zone = CLOCK_TIME_ZONES.find( ( item ) => item.toLowerCase() === query || clockCity( item ).toLowerCase() === query );
        if ( zone) onChange( zone );
        else if ( !query ) onChange( '' );
    };

    return (
        <label className="mt-2 block">
            <span className="ctl-label">Second clock city or time zone</span>
            <input
                className="field mt-1"
                list="clock-screen-time-zones"
                value={draft}
                placeholder="e.g. Tokyo or Asia/Tokyo"
                onChange={( e ) => onInput( e.target.value )}
            />
            <datalist id="clock-screen-time-zones">
                {CLOCK_TIME_ZONES.map( ( zone ) => <option key={zone} value={zone} label={clockCity( zone )} /> )}
            </datalist>
            <span className="hint mt-1 block">
                {draft && !hasMatchingZone ? 'Choose a suggested city or enter its time zone.' : 'Choose a city to show its local time and date.'}
            </span>
        </label>
    );
}

const IDLE_DELAYS = [
    { value: 30, label: '30s' },
    { value: 60, label: '1m' },
    { value: 120, label: '2m' },
    { value: 300, label: '5m' },
    { value: 600, label: '10m' },
];

export default function StudioDrawer() {
    const {
        settings: s,
        tiles,
        update,
        applyPreset,
        resetSettings,
        importBackup,
        setCustomWallpaper,
        addWidget,
        removeWidget,
        autoAdjustLayout,
        drawerOpen,
        setDrawerOpen,
        editor,
        openEditor,
    } =
        useStore();
    const fileRef = useRef( null );
    const backupRef = useRef( null );
    const [wpError, setWpError] = useState( '' );
    const [backupMsg, setBackupMsg] = useState( '' );
    const [busy, setBusy] = useState( false );
    const [customWp, setCustomWp] = useState( null );
    const [fineTune, setFineTune] = useState( false );
    const spacingPreset = Object.keys( SPACING_PRESETS ).find( ( id ) =>
        Object.entries( SPACING_PRESETS[id].values ).every( ( [k, v] ) => s[k] === v )
    );
    const [wpTab, setWpTab] = useState(
        () => ( s.wallpaper === 'custom' ? 'Photo' : WALLPAPERS.find( ( w ) => w.id === s.wallpaper )?.group ?? WALLPAPER_GROUPS[0] )
    );
    const hasManualPlacements = tiles.some( ( tile ) => tile.gridPosition || tile.mosaicPosition );
    let uploadLabel = 'Upload';
    if ( busy ) uploadLabel = 'Processing…';
    else if ( customWp ) uploadLabel = 'Replace';

    useEffect( () => {
        let live = true;
        loadImage( WALLPAPER_KEY ).then( ( data ) => live && setCustomWp( data?.startsWith( 'data:image/' ) ? data : null ) );
        return () => {
            live = false;
        };
    }, [s.wallpaperRev] );

    const exportBackup = async () => {
        try {
            const spaces = await Promise.all( s.spaces.map( async ( space ) => {
                const key = space.id === 'home' ? 'tiles' : `spaceTiles:${space.id}`;
                const saved = space.id === s.activeSpaceId ? null : await storage.get( 'sync', [key] );
                return { id: space.id, name: space.name, tiles: space.id === s.activeSpaceId ? tiles : saved[key] ?? [] };
            } ) );
            const blob = new Blob( [JSON.stringify( { app: 'glassify-tab', version: 2, settings: s, tiles, spaces }, null, 2 )], {
                type: 'application/json',
            } );
            const a = document.createElement( 'a' );
            a.href = URL.createObjectURL( blob );
            a.download = `glassify-backup-${new Date().toISOString().slice( 0, 10 )}.json`;
            a.click();
            URL.revokeObjectURL( a.href );
        } catch {
            setBackupMsg( 'Could not export backup.' );
        }
    };

    const onImport = async ( e ) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if ( !file ) return;
        try {
            if ( file.size > 512 * 1024 ) throw new Error( 'Backup file is too large.' );
            await importBackup( JSON.parse( await file.text() ) );
            setBackupMsg( 'Backup restored.' );
        } catch ( err ) {
            setBackupMsg( err instanceof SyntaxError ? 'File is not valid JSON.' : err.message );
        }
    };

    useEffect( () => {
        if ( !drawerOpen ) return;
        const onKey = ( e ) => e.key === 'Escape' && !editor && setDrawerOpen( false );
        window.addEventListener( 'keydown', onKey );
        return () => window.removeEventListener( 'keydown', onKey );
    }, [drawerOpen, editor, setDrawerOpen] );

    const onWallpaper = async ( e ) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if ( !file ) return;
        setWpError( '' );
        setBusy( true );
        try {
            const [full, thumb] = await Promise.all( [
                readImage( file, { max: 2560, type: 'image/jpeg', quality: 0.86 } ),
                readImage( file, { max: 48, type: 'image/jpeg', quality: 0.6 } ),
            ] );
            writeLocal( WP_THUMB_KEY, thumb );
            await setCustomWallpaper( full );
        } catch ( err ) {
            setWpError( err.message );
        } finally {
            setBusy( false );
        }
    };

    return (
        <aside
            className={`drawer studio ${drawerOpen ? 'open' : ''}`}
            aria-label="Glassify Studio"
            aria-hidden={!drawerOpen}
            inert={drawerOpen ? undefined : ''}
        >
            <header className="drawer-head">
                <div className="flex items-center gap-2">
                    <img src="icons/icon32.png" alt="" width="24" height="24" />
                    <h2 className="studio-title">Glassify Studio</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button className="btn h-7 w-7 rounded-full p-0" onClick={() => setDrawerOpen( false )} aria-label="Close studio">
                        <X size={14} />
                    </button>
                </div>
            </header>

            <div className="drawer-body">
                <Section title="Profile">
                    <div className="ctl py-1">
                        <span className="ctl-label">Your Name</span>
                        <div className="w-40">
                            <TextSetting
                                value={s.userName}
                                placeholder="Optional"
                                maxLength={30}
                                onCommit={( userName ) => update( { userName } )}
                            />
                        </div>
                    </div>
                    <p className="hint mt-1">Used in the Clock screen and Hydration widget.</p>
                </Section>

                <Section
                    title="Layout"
                    action={
                        <button
                            type="button"
                            className="btn"
                            onClick={autoAdjustLayout}
                            disabled={!hasManualPlacements}
                            title="Clear pinned tile positions and fill layout gaps"
                        >
                            <RotateCcw size={13} /> Auto Adjust
                        </button>
                    }
                >
                    <div className="preset-grid" role="radiogroup" aria-label="Layout preset">
                        {Object.entries( PRESETS ).map( ( [id, p] ) => (
                            <button
                                key={id}
                                type="button"
                                role="radio"
                                aria-checked={s.preset === id}
                                className="preset-card"
                                onClick={() => applyPreset( id )}
                            >
                                <PresetPreview preset={id} />
                                <span className="preset-name">{p.short}</span>
                                <span className="preset-desc">{p.description}</span>
                            </button>
                        ) )}
                    </div>

                    <div className="sub-label">Grid</div>
                    <div className="seg seg-full mb-1" role="group" aria-label="Grid type">
                        {GRID_TYPES.map( ( g ) => (
                            <button key={g.value} type="button" aria-pressed={s.gridType === g.value} onClick={() => update( { gridType: g.value } )}>
                                {g.label}
                            </button>
                        ) )}
                    </div>
                    <p className="hint mb-1 mt-1">{GRID_HINTS[s.gridType]}</p>
                    {s.gridType === 'custom' && (
                        <Slider label="Columns" min={2} max={12} value={s.columns} onChange={( columns ) => update( { columns } )} />
                    )}

                    <div className="sub-label">Spacing</div>
                    <div className="seg seg-full" role="group" aria-label="Spacing preset">
                        {Object.entries( SPACING_PRESETS ).map( ( [id, p] ) => (
                            <button key={id} type="button" aria-pressed={spacingPreset === id} onClick={() => update( p.values )}>
                                {p.label}
                            </button>
                        ) )}
                    </div>

                    <button type="button" className="fine-tune-toggle" aria-expanded={fineTune} onClick={() => setFineTune( ( v ) => !v )}>
                        <SlidersHorizontal size={13} />
                        Fine-tune
                        {!spacingPreset && <span className="fine-tune-badge">Custom</span>}
                        <ChevronDown size={14} className="fine-tune-chevron" />
                    </button>
                    {fineTune && (
                        <div className="fine-tune">
                            <Slider label="Icon Size" min={0} max={100} value={100 - s.density} suffix="%" onChange={( v ) => update( { density: 100 - v } )} />
                            <Slider label="Item Spacing" min={0} max={40} value={s.gap} suffix="px" onChange={( gap ) => update( { gap } )} />
                            <Slider label="Side Margin" min={0} max={120} value={s.padX} suffix="px" onChange={( padX ) => update( { padX } )} />
                            <Slider label="Top Margin" min={0} max={80} value={s.padY} suffix="px" onChange={( padY ) => update( { padY } )} />
                            <Slider
                                label="Max Width"
                                min={960}
                                max={2560}
                                step={40}
                                value={s.maxWidth}
                                suffix="px"
                                onChange={( maxWidth ) => update( { maxWidth } )}
                            />
                        </div>
                    )}
                    <p className="hint mt-2">
                        <LayoutGrid size={11} className="mr-1 inline" />
                        Use the grid button in the top bar to drag, resize or remove widgets.
                    </p>
                    <p className="hint mt-1">Auto Adjust clears pinned tile positions so the grid can reflow and fill gaps.</p>
                </Section>

                <Section title="Typography" collapsible summary={FONTS.find( ( f ) => f.id === s.font )?.name}>
                    {drawerOpen && <style>{PREVIEW_FONT_CSS}</style>}
                    <div className="font-grid">
                        {FONTS.map( ( f ) => (
                            <button
                                key={f.id}
                                type="button"
                                className="font-option"
                                aria-pressed={s.font === f.id}
                                onClick={() => update( { font: f.id } )}
                                style={{ fontFamily: fontAssets( f.id ).stack }}
                            >
                                <span className="font-sample">Aa</span>
                                <span className="font-name">{f.name}</span>
                            </button>
                        ) )}
                    </div>
                    <Slider
                        label="Text Size"
                        min={85}
                        max={130}
                        step={5}
                        value={s.textScale}
                        suffix="%"
                        onChange={( textScale ) => update( { textScale } )}
                    />
                </Section>

                <Section title="Icon & Label Assets" collapsible>
                    <Segmented
                        label="Icon Shape"
                        options={[
                            { value: 'squircle', label: 'Squircle' },
                            { value: 'rounded', label: 'Rounded' },
                        ]}
                        value={s.iconShape}
                        onChange={( iconShape ) => update( { iconShape } )}
                    />
                    <Slider label="Corner Radius" min={0} max={50} value={s.radius} suffix="%" onChange={( radius ) => update( { radius } )} />

                    <div className="sub-label">Tiles</div>
                    <Slider
                        label="Icon Size"
                        min={0}
                        max={100}
                        value={100 - s.density}
                        suffix="%"
                        onChange={( v ) => update( { density: 100 - v } )}
                    />
                    <Slider
                        label="Favicon Size"
                        min={30}
                        max={90}
                        value={s.faviconSize}
                        suffix="%"
                        onChange={( faviconSize ) => update( { faviconSize } )}
                    />

                    <div className="sub-label">Groups</div>
                    <Slider
                        label="Group Icon Size"
                        min={28}
                        max={72}
                        value={s.groupIconSize}
                        suffix="px"
                        onChange={( groupIconSize ) => update( { groupIconSize } )}
                    />
                    <Slider
                        label="Group Favicon Size"
                        min={30}
                        max={90}
                        value={s.groupFaviconSize}
                        suffix="%"
                        onChange={( groupFaviconSize ) => update( { groupFaviconSize } )}
                    />
                    <Slider
                        label="Group Icon Spacing"
                        min={0}
                        max={24}
                        value={s.groupGap}
                        suffix="px"
                        onChange={( groupGap ) => update( { groupGap } )}
                    />
                    <Toggle label="Labels in Groups" checked={s.groupLabels} onChange={( groupLabels ) => update( { groupLabels } )} />

                    <div className="sub-label">Appearance</div>
                    <Slider
                        label="Icon Opacity"
                        min={10}
                        max={100}
                        value={s.iconOpacity}
                        suffix="%"
                        onChange={( iconOpacity ) => update( { iconOpacity } )}
                    />
                    <Segmented label="Show Icon Labels" options={LABEL_MODES} value={s.labels} onChange={( labels ) => update( { labels } )} />
                </Section>

                <Section title="Widget Studio" collapsible defaultOpen>
                    <Toggle label="Glass Effect" checked={s.glass} onChange={( glass ) => update( { glass } )} />
                    <Segmented
                        label="Glass Tint"
                        options={[
                            { value: 'light', label: 'Light' },
                            { value: 'dark', label: 'Dark' },
                            { value: 'auto', label: 'Auto' },
                        ]}
                        value={s.glassTint}
                        onChange={( glassTint ) => update( { glassTint } )}
                    />
                    <Slider
                        label="Opacity"
                        min={0}
                        max={100}
                        value={s.glassOpacity}
                        suffix="%"
                        onChange={( glassOpacity ) => update( { glassOpacity } )}
                    />
                    <Slider label="Element Padding H" min={4} max={32} value={s.elPadX} suffix="px" onChange={( elPadX ) => update( { elPadX } )} />
                    <Slider label="Element Padding V" min={4} max={32} value={s.elPadY} suffix="px" onChange={( elPadY ) => update( { elPadY } )} />
                    <div className="ctl">
                        <span className="ctl-label">Weather City</span>
                        <div className="w-40">
                            <TextSetting
                                value={s.weatherCity}
                                placeholder="Auto-detect location"
                                onCommit={( weatherCity ) => update( { weatherCity } )}
                            />
                        </div>
                    </div>
                    <Segmented
                        label="Units"
                        options={[
                            { value: 'fahrenheit', label: '°F' },
                            { value: 'celsius', label: '°C' },
                        ]}
                        value={s.tempUnit}
                        onChange={( tempUnit ) => update( { tempUnit } )}
                    />
                </Section>

                <Section
                    title="Tile & App Engine"
                    collapsible
                    action={
                        <button className="btn btn-primary h-7" onClick={() => openEditor( null )}>
                            <Plus size={14} /> New Tile
                        </button>
                    }
                >
                    <Toggle label="Fetch Favicon" checked={s.fetchFavicon} onChange={( fetchFavicon ) => update( { fetchFavicon } )} />
                    <Segmented
                        label="Open Tiles In"
                        options={[
                            { value: 'same', label: 'Same Tab' },
                            { value: 'new', label: 'New Tab' },
                        ]}
                        value={s.openIn}
                        onChange={( openIn ) => update( { openIn } )}
                    />
                    {s.fetchFavicon && (
                        <>
                            <Toggle label="HD Icons" checked={s.hdIcons} onChange={( hdIcons ) => update( { hdIcons } )} />
                            <p className="hint mb-2 mt-0">
                                Loads sharp icons from Google&apos;s favicon service, even for sites you haven&apos;t visited. Turn off to
                                use only icons Chrome has already cached.
                            </p>
                        </>
                    )}
                    <div className="ctl-label mb-2 mt-1">Tile Background Style</div>
                    <div className="flex flex-wrap items-center gap-2">
                        {TILE_BGS.map( ( bg ) => (
                            <button
                                key={bg}
                                className="swatch"
                                style={{ background: bg }}
                                aria-pressed={s.tileBg === bg}
                                aria-label={`Tile background ${bg}`}
                                onClick={() => update( { tileBg: bg } )}
                            />
                        ) )}
                        <ColorSwatch
                            value={s.tileBg}
                            active={!TILE_BGS.includes( s.tileBg )}
                            onChange={( tileBg ) => update( { tileBg } )}
                            label="Custom tile background colour"
                        />
                    </div>
                    <p className="hint">
                        Use the grid button in the top bar to edit the layout: drag widgets and tiles, rename groups, or add tiles to a
                        group. Right-click any tile to edit it.
                    </p>
                </Section>

                <Section
                    title="Widgets"
                    collapsible
                    summary={`${( s.layoutWidgets[s.preset] ?? [] ).length} on`}
                    action={
                        <span className="widget-count">
                            {( s.layoutWidgets[s.preset] ?? [] ).length} / {Object.keys( WIDGET_CATALOG ).length} on
                        </span>
                    }
                >
                    <p className="hint mb-3 mt-0">Pick what shows on the {PRESETS[s.preset]?.label ?? 'current'} layout.</p>
                    {WIDGET_CATEGORIES.map( ( cat ) => (
                        <div key={cat.id} className="widget-cat">
                            <div className="widget-cat-title">{cat.name}</div>
                            <div className="widget-cat-list">
                                {Object.entries( WIDGET_CATALOG )
                                    .filter( ( [, w] ) => w.category === cat.id )
                                    .map( ( [id, w] ) => {
                                        const on = ( s.layoutWidgets[s.preset] ?? [] ).includes( id );
                                        return (
                                            <button
                                                key={id}
                                                type="button"
                                                role="switch"
                                                aria-checked={on}
                                                className="widget-row"
                                                onClick={() => ( on ? removeWidget( s.preset, id ) : addWidget( s.preset, id ) )}
                                            >
                                                <span className="widget-row-icon" style={{ '--cat': cat.color }}>
                                                    <w.icon size={16} />
                                                </span>
                                                <span className="widget-row-text">
                                                    <span className="widget-row-name">{w.name}</span>
                                                    <span className="widget-row-desc">{w.description}</span>
                                                </span>
                                                <span className="switch" aria-hidden="true" aria-checked={on} />
                                            </button>
                                        );
                                    } )}
                            </div>
                        </div>
                    ) )}
                </Section>

                <Section title="Developer" collapsible>
                    <GithubTokenSetting />
                </Section>

                <Section title="Daily Quote" collapsible summary={PERSONAS[s.persona]?.label}>
                    <p className="hint mb-2 mt-0">Shows a quote at the bottom of the dashboard, picked for your profession.</p>
                    <select className="field" value={s.persona} onChange={( e ) => update( { persona: e.target.value } )}>
                        {Object.entries( PERSONAS ).map( ( [id, p] ) => (
                            <option key={id} value={id}>
                                {p.label}
                            </option>
                        ) )}
                    </select>
                </Section>

                <Section
                    title="Clock Screen"
                    collapsible
                    summary={s.idleEnabled ? CLOCK_STYLES.find( ( c ) => c.value === s.clockStyle )?.label : 'Off'}
                >
                    <p className="hint mb-2 mt-0">A full-screen clock with your daily quote appears when you stop using the page.</p>
                    <Toggle label="Show When Idle" checked={s.idleEnabled} onChange={( idleEnabled ) => update( { idleEnabled } )} />
                    {s.idleEnabled && (
                        <Segmented label="After" options={IDLE_DELAYS} value={s.idleDelay} onChange={( idleDelay ) => update( { idleDelay } )} />
                    )}
                    <div className="ctl-label mb-2 mt-2">Clock Style</div>
                    <div className="clock-style-grid">
                        {CLOCK_STYLES.map( ( c ) => (
                            <button
                                key={c.value}
                                type="button"
                                className={`clock-style-option sample-${c.value}`}
                                aria-pressed={s.clockStyle === c.value}
                                onClick={() => update( { clockStyle: c.value } )}
                            >
                                <span className="clock-style-sample">
                                    {c.value === 'analog' ? <Clock3 size={22} strokeWidth={1.5} /> : c.sample}
                                </span>
                                <span className="wp-name">{c.label}</span>
                            </button>
                        ) )}
                    </div>
                    {s.clockStyle === 'dual' && (
                        <ClockCitySetting value={s.clockTimeZone} onChange={( clockTimeZone ) => update( { clockTimeZone } )} />
                    )}
                    <Toggle label="24-Hour Time" checked={s.clock24h} onChange={( clock24h ) => update( { clock24h } )} />
                    <button
                        type="button"
                        className="btn mt-3 w-full"
                        onClick={() => {
                            setDrawerOpen( false );
                            window.dispatchEvent( new Event( PREVIEW_IDLE_EVENT ) );
                        }}
                    >
                        <Eye size={14} /> Preview Clock
                    </button>
                </Section>

                <Section
                    title="Theme & Wallpaper"
                    collapsible
                    defaultOpen
                    summary={s.wallpaper === 'custom' ? 'Your Photo' : WALLPAPERS.find( ( w ) => w.id === s.wallpaper )?.name}
                >
                    <div className="seg mb-3 flex w-full" role="tablist" aria-label="Wallpaper style">
                        {[...WALLPAPER_GROUPS, 'Photo'].map( ( g ) => (
                            <button
                                key={g}
                                type="button"
                                role="tab"
                                className="flex-1"
                                aria-pressed={wpTab === g}
                                aria-selected={wpTab === g}
                                onClick={() => setWpTab( g )}
                            >
                                {g}
                            </button>
                        ) )}
                    </div>
                    <div className="wp-grid">
                        {WALLPAPERS.filter( ( wp ) => wp.group === wpTab ).map( ( wp ) => (
                            <button
                                key={wp.id}
                                className="wp-option"
                                aria-pressed={s.wallpaper === wp.id}
                                onClick={() => update( { wallpaper: wp.id } )}
                            >
                                <span className="wp-thumb" style={{ background: wp.css }} />
                                <span className="wp-name">{wp.name}</span>
                            </button>
                        ) )}
                        {wpTab === 'Photo' && customWp && (
                            <button className="wp-option" aria-pressed={s.wallpaper === 'custom'} onClick={() => update( { wallpaper: 'custom' } )}>
                                <span className="wp-thumb" style={{ backgroundImage: `url("${customWp}")` }} />
                                <span className="wp-name">Your Photo</span>
                            </button>
                        )}
                        {wpTab === 'Photo' && (
                            <button className="wp-option" onClick={() => fileRef.current?.click()} disabled={busy}>
                                <span className="wp-thumb wp-upload">
                                    <ImageUp size={16} />
                                </span>
                                <span className="wp-name">{uploadLabel}</span>
                            </button>
                        )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={onWallpaper} />
                    {wpError && <p className="hint error">{wpError}</p>}
                    {wpTab === 'Photo' && s.wallpaper === 'custom' && customWp && (
                        <div className="photo-controls">
                            <div className="sub-label">Photo Adjustments</div>
                            <Slider label="Opacity" min={20} max={100} value={s.wallpaperOpacity} suffix="%" onChange={( wallpaperOpacity ) => update( { wallpaperOpacity } )} />
                            <Slider label="Blur" min={0} max={20} value={s.wallpaperBlur} suffix="px" onChange={( wallpaperBlur ) => update( { wallpaperBlur } )} />
                            <Slider label="Dark Overlay" min={0} max={60} value={s.wallpaperOverlay} suffix="%" onChange={( wallpaperOverlay ) => update( { wallpaperOverlay } )} />
                        </div>
                    )}
                </Section>

                <Section title="Privacy & Data" collapsible summary="Storage, permissions, and connections">
                    <div className="privacy-points">
                        <p><strong>Chrome Sync</strong><span>Preferences, Spaces, and shortcut links sync through your Chrome account.</span></p>
                        <p><strong>On this device</strong><span>Notes, tasks, reminder data, uploaded images, and GitHub tokens stay in local browser storage.</span></p>
                        <p><strong>Connected services</strong><span>Search, weather, feeds, icons, and optional developer widgets contact their providers when used. Glassify does not run analytics.</span></p>
                        <p><strong>Browser data</strong><span>Most Visited, Recently Closed, and Browser Boost use Chrome tab data when those widgets are enabled.</span></p>
                        <p><strong>Website access</strong><span>The roaming buddy is off by default. If enabled, it reads reminder settings and your display name, not page content.</span></p>
                    </div>
                </Section>

                <Section title="Backup" collapsible>
                    <div className="grid grid-cols-2 gap-2">
                        <button className="btn" onClick={exportBackup}>
                            <Download size={14} /> Export
                        </button>
                        <button className="btn" onClick={() => backupRef.current?.click()}>
                            <Upload size={14} /> Import
                        </button>
                    </div>
                    <input ref={backupRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
                    {backupMsg && <p className="hint">{backupMsg}</p>}
                    <button
                        className="btn mt-2 w-full"
                        onClick={() => {
                            setDrawerOpen( false );
                            setTimeout( () => window.dispatchEvent( new Event( 'glassify:tour' ) ), 350 );
                        }}
                    >
                        <Eye size={14} /> Replay welcome tour
                    </button>
                    <button className="btn btn-danger mt-2 w-full" onClick={resetSettings}>
                        <RotateCcw size={14} /> Restore default appearance
                    </button>
                </Section>

                <p className="hint mt-6 text-center">
                    Glassify Tab v{typeof chrome !== 'undefined' && chrome.runtime?.getManifest ? chrome.runtime.getManifest().version : 'dev'}
                    {' · '}
                    <kbd className="font-sans">/</kbd> to search · <kbd className="font-sans">Esc</kbd> to close
                </p>
            </div>
        </aside>
    );
}
