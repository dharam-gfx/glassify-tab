import { Minus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStore } from '../state/store';
import { iconKey, loadImage } from '../state/storage';
import { sanitizeBg } from '../state/defaults';
import { iconSources, normalizeUrl } from '../lib/url';

export const TILE_DRAG = 'application/x-glassify-tile';

function LetterAvatar( { title, text, bg } ) {
  const seed = ( title || '?' ).trim();
  const display = text ? text.trim().toUpperCase().slice( 0, 3 ) : seed.charAt( 0 ).toUpperCase();

  // Custom text sits on the tile's own background colour instead of an auto-generated one.
  if ( text ) {
    return (
      <span className="letter-avatar" data-len={display.length} style={{ background: bg, color: textColorFor( bg ) }}>
        {display}
      </span>
    );
  }

  let hash = 0;
  for ( const ch of seed ) hash = ( hash * 31 + ch.charCodeAt( 0 ) ) | 0;
  const hue = Math.abs( hash ) % 360;
  return (
    <span
      className="letter-avatar"
      data-len={display.length}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 80% 62%), hsl(${( hue + 40 ) % 360} 75% 48%))` }}
    >
      {display}
    </span>
  );
}

/** Picks readable text over a solid/gradient background by averaging the luminance of its colour stops. */
function textColorFor( bg ) {
  const hexes = bg.match( /#[0-9a-f]{6}/gi ) || [];
  const rgbas = [...bg.matchAll( /rgba?\(([^)]+)\)/gi )].map( ( m ) => m[1].split( ',' ).map( Number ) );
  const luminances = [
    ...hexes.map( ( hex ) => {
      const n = parseInt( hex.slice( 1 ), 16 );
      return 0.299 * ( ( n >> 16 ) & 255 ) + 0.587 * ( ( n >> 8 ) & 255 ) + 0.114 * ( n & 255 );
    } ),
    // A translucent colour (e.g. the frosted-glass swatch) is mostly whatever's behind it, not its own hue,
    // so weight its luminance down by alpha instead of treating it as a fully opaque colour.
    ...rgbas.map( ( [r, g, b, a = 1] ) => ( 0.299 * r + 0.587 * g + 0.114 * b ) * a ),
  ];
  if ( !luminances.length ) return '#fff';
  const avg = luminances.reduce( ( a, b ) => a + b, 0 ) / luminances.length;
  return avg > 150 ? '#1c1c1e' : '#fff';
}

export function TileImage( { tile } ) {
  const { settings } = useStore();
  const [custom, setCustom] = useState( null );
  const [sourceIndex, setSourceIndex] = useState( 0 );
  // Chrome only caches a site's favicon after you've actually visited it; re-check when you come back to the tab.
  const [retryTick, setRetryTick] = useState( 0 );

  useEffect( () => {
    if ( !tile.customIcon ) return setCustom( null );
    let live = true;
    loadImage( iconKey( tile.id ) ).then( ( data ) => live && setCustom( data ) );
    return () => {
      live = false;
    };
  }, [tile.id, tile.customIcon, tile.iconRev] );

  useEffect( () => setSourceIndex( 0 ), [tile.url, settings.hdIcons] );

  useEffect( () => {
    const onFocus = () => {
      if ( document.visibilityState !== 'visible' ) return;
      setSourceIndex( 0 );
      setRetryTick( ( n ) => n + 1 );
    };
    window.addEventListener( 'focus', onFocus );
    document.addEventListener( 'visibilitychange', onFocus );
    return () => {
      window.removeEventListener( 'focus', onFocus );
      document.removeEventListener( 'visibilitychange', onFocus );
    };
  }, [] );

  if ( custom ) return <img className="custom" src={custom} alt="" draggable={false} />;
  if ( tile.iconText ) {
    const resolvedBg = ( tile.bg && sanitizeBg( tile.bg ) ) ?? sanitizeBg( settings.tileBg ) ?? '#ffffff';
    return <LetterAvatar title={tile.title} text={tile.iconText} bg={resolvedBg} />;
  }
  const sources = settings.fetchFavicon
    ? iconSources( tile.url, { hd: tile.preferCachedIcon ? false : settings.hdIcons, size: 64, bust: retryTick || undefined } )
    : [];
  const src = sources[sourceIndex];
  if ( src ) {
    return (
      <img
        key={src}
        className="favicon"
        src={src}
        alt=""
        draggable={false}
        onError={() => setSourceIndex( ( i ) => i + 1 )}
      />
    );
  }
  return <LetterAvatar title={tile.title} text={tile.iconText} />;
}

// groupAware: dropping onto this tile also moves the dragged tile into this tile's group.
export default function Tile( { tile, groupAware = false, gridPosition } ) {
  const { moveTile, openEditor, removeTile, editMode, settings } = useStore();
  const [over, setOver] = useState( false );
  const bg = tile.bg ? sanitizeBg( tile.bg ) : undefined;
  const Root = editMode ? 'div' : 'a';
  const newTab = ( tile.openIn || settings.openIn ) === 'new';

  return (
    <Root
      className={`tile${over ? ' drop-target' : ''}`}
      data-tile-id={tile.id}
      style={gridPosition ? { gridColumn: String( gridPosition.column ), gridRow: String( gridPosition.row ) } : undefined}
      {...( editMode
        ? { role: 'button', tabIndex: 0, onClick: () => openEditor( tile ), onKeyDown: ( e ) => e.key === 'Enter' && openEditor( tile ) }
        : {
          href: normalizeUrl( tile.url ) ?? '#',
          ...( newTab && { target: '_blank', rel: 'noopener noreferrer' } ),
        } )}
      title={editMode ? `Edit ${tile.title}` : tile.title}
      draggable
      onDragStart={( e ) => {
        e.stopPropagation();
        e.dataTransfer.setData( TILE_DRAG, tile.id );
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={( e ) => {
        if ( !e.dataTransfer.types.includes( TILE_DRAG ) ) return;
        e.preventDefault();
        e.stopPropagation();
        setOver( true );
      }}
      onDragLeave={() => setOver( false )}
      onDrop={( e ) => {
        const from = e.dataTransfer.getData( TILE_DRAG );
        setOver( false );
        if ( !from ) return;
        e.preventDefault();
        e.stopPropagation();
        if ( from !== tile.id ) moveTile( from, tile.id, groupAware );
      }}
      onContextMenu={( e ) => {
        e.preventDefault();
        openEditor( tile );
      }}
    >
      <span className="tile-icon-wrap">
        <span className="tile-icon" style={bg ? { background: bg } : undefined}>
          <TileImage tile={tile} />
        </span>
        {editMode && (
          <button
            className="tile-remove"
            aria-label={`Remove ${tile.title}`}
            onClick={( e ) => {
              e.stopPropagation();
              if ( window.confirm( `Remove "${tile.title}"?` ) ) removeTile( tile.id );
            }}
          >
            <Minus size={12} strokeWidth={3} />
          </button>
        )}
      </span>
      <span className="tile-label">{tile.title}</span>
    </Root>
  );
}
