'use client'

import { Tables } from '@/lib/supabase/types'
import Link from "next/link";
import { motion } from 'framer-motion';
import Image from "next/image";
import { ArrowRight, Utensils, Calendar, Info, FileText, LayoutGrid, FileSignature, ShoppingBag, Building2, MapPin, Phone, MessageCircle, ExternalLink } from "lucide-react";
import { getDefaultCoverForPreset } from '@/lib/templates/presets';

function getLuminance(hex: string) {
  let r = 0, g = 0, b = 0;
  if (hex?.length === 4) { r = parseInt(hex[1]+hex[1],16); g = parseInt(hex[2]+hex[2],16); b = parseInt(hex[3]+hex[3],16); }
  else if (hex?.length === 7) { r = parseInt(hex.substring(1,3),16); g = parseInt(hex.substring(3,5),16); b = parseInt(hex.substring(5,7),16); }
  else { return 0; }
  const [rs,gs,bs] = [r,g,b].map(c => { c=c/255; return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4); });
  return 0.2126*rs+0.7152*gs+0.0722*bs;
}

function hexToRgba(hex: string, alpha: number) {
  let r=0,g=0,b=0;
  if(hex?.length===7){r=parseInt(hex.substring(1,3),16);g=parseInt(hex.substring(3,5),16);b=parseInt(hex.substring(5,7),16);}
  return `rgba(${r},${g},${b},${alpha})`;
}

const TEMPLATE_META: Record<string,{icon:React.ReactNode;subtitle:string}> = {
  restaurant:{icon:<Utensils className="w-5 h-5"/>,subtitle:'Browse & Order'},
  booking:{icon:<Calendar className="w-5 h-5"/>,subtitle:'Check Availability'},
  catalog:{icon:<ShoppingBag className="w-5 h-5"/>,subtitle:'View Catalog'},
  listing:{icon:<Building2 className="w-5 h-5"/>,subtitle:'View Listings'},
  rate_card:{icon:<FileText className="w-5 h-5"/>,subtitle:'View Pricing'},
  quote:{icon:<FileSignature className="w-5 h-5"/>,subtitle:'Request a Quote'},
  info:{icon:<Info className="w-5 h-5"/>,subtitle:'Learn More'},
  custom:{icon:<LayoutGrid className="w-5 h-5"/>,subtitle:'Explore'},
};

function getTemplateMeta(page: { template_type: string; title?: string; business_type_preset?: string | null }) {
  const isFood = 
    ['restaurant', 'bar_lounge', 'food_truck', 'cafe', 'catering'].includes(page.business_type_preset || '') ||
    /menu|dining|food|dish|drink|beverage|kitchen|bar|lunch|dinner|breakfast|snack|patio/i.test(page.title || '');

  if (page.template_type === 'catalog' && isFood) {
    return { icon: <Utensils className="w-5 h-5" />, subtitle: 'Browse & Order' };
  }

  return TEMPLATE_META[page.template_type] ?? TEMPLATE_META.custom;
}

type DesignTokens = {
  layout_mode?: 'list' | 'bento_grid' | 'masonry';
  surface_style?: 'glassmorphism' | 'solid' | 'flat' | 'neumorphism';
  corner_radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  typography?: 'modern' | 'elegant' | 'playful' | 'industrial';
  animation_style?: 'energetic' | 'elegant' | 'instant';
  density?: 'airy' | 'standard' | 'cozy';
  color_theme?: 'true_dark' | 'dim' | 'light' | 'tinted';
};

const RADIUS_MAP: Record<string, string> = {
  'none': 'rounded-none',
  'sm': 'rounded-sm',
  'md': 'rounded-md',
  'lg': 'rounded-lg',
  'xl': 'rounded-xl',
  '2xl': 'rounded-2xl',
  'full': 'rounded-full',
};

import { useTheme } from './theme-injector'

export function PortalRenderer({location,pages}:{
  location:Tables<'locations'>&{organizations?:{
    logo_url?:string|null, 
    name?:string|null,
    portal_name?:string|null,
    portal_theme_color?:string|null,
    portal_background_color?:string|null,
    portal_cover_image_url?:string|null
  }|null};
  pages: { id: string; slug: string; title: string; template_type: string; is_published: boolean; business_type_preset?: string | null }[];
}) {
  const org = location.organizations;
  const { tokens: liveTokens } = useTheme()
  const themeColor = org?.portal_theme_color || location.theme_color || '#6d28d9';
  const bgColor = org?.portal_background_color || '#09090b';
  const isLight = getLuminance(themeColor)>0.5;
  const onThemeText = isLight?'text-zinc-950':'text-white';
  const hasSocials = !!(location.instagram_handle||location.twitter_handle||location.x_handle||location.tiktok_handle||location.whatsapp_number);
  const hasContact = !!(location.address||location.phone_number);
  const logoUrl = org?.logo_url;
  const coverImageUrl = org?.portal_cover_image_url || location.cover_image_url;
  const displayName = org?.portal_name || location.portal_display_name || org?.name || location.name;

  const layoutMode = liveTokens.layout_mode || 'list';
  const surfaceStyle = liveTokens.surface_style || 'glassmorphism';
  const radiusClass = RADIUS_MAP[liveTokens.corner_radius || '2xl'] || 'rounded-2xl';
  const density = liveTokens.density || 'standard';
  const animationStyle = liveTokens.animation_style || 'elegant';
  const colorTheme = liveTokens.color_theme || 'dim';
  
  const gapClass = density === 'cozy' ? 'gap-2' : density === 'airy' ? 'gap-6' : 'gap-4';
  const paddingClass = density === 'cozy' ? 'px-2 py-3' : density === 'airy' ? 'px-6 py-6' : 'px-4 py-4';

  const springTransition = animationStyle === 'energetic' 
    ? { type: 'spring' as const, stiffness: 400, damping: 17 } 
    : animationStyle === 'instant' 
      ? { duration: 0 } 
      : { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const };

  const getSurfaceClass = (isPrimary: boolean) => {
    if (isPrimary) {
      if (surfaceStyle === 'flat') return '';
      if (surfaceStyle === 'neumorphism') return 'shadow-[inset_0_-2px_4px_rgba(0,0,0,0.4),0_4px_8px_rgba(0,0,0,0.5)] bg-opacity-100';
      return 'shadow-lg bg-opacity-90 backdrop-blur-md'; // glassmorphism
    } else {
      if (surfaceStyle === 'flat') return 'bg-zinc-900 border-transparent';
      if (surfaceStyle === 'neumorphism') return 'bg-zinc-900 shadow-[2px_2px_5px_rgba(0,0,0,0.4),-2px_-2px_5px_rgba(255,255,255,0.05)] border-transparent';
      return 'bg-zinc-900/80 backdrop-blur-md border border-zinc-800'; // glassmorphism
    }
  };

  const getBackgroundColor = () => {
    if (colorTheme === 'true_dark') return '#000000';
    if (colorTheme === 'light') return '#f4f4f5';
    if (colorTheme === 'tinted') return hexToRgba(themeColor, 0.05);
    return bgColor; // dim
  };

  const themeBgColor = getBackgroundColor();

  const fontClass = 
    liveTokens.typography === 'elegant' ? 'font-serif' :
    liveTokens.typography === 'playful' ? 'font-sans' : // Outfit is a sans font
    liveTokens.typography === 'industrial' ? 'font-mono' :
    'font-sans'; // Default is modern

  const effectiveCover = coverImageUrl || getDefaultCoverForPreset(pages[0]?.business_type_preset, pages[0]?.template_type)

  return (
    <div className={`min-h-screen ${fontClass} overflow-x-hidden transition-colors duration-300`} style={{ backgroundColor: themeBgColor }}>
      <div className="relative h-72 sm:h-80 overflow-hidden">
        {effectiveCover ? (
          <>
            <Image src={effectiveCover} alt={displayName} fill className="object-cover object-top" priority quality={90} sizes="100vw"/>
            <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 50%, ${bgColor} 100%)` }}/>
          </>
        ) : (
          <div
            className="absolute inset-0 bg-zinc-950"
            style={{
              background: `
                radial-gradient(ellipse 80% 80% at 50% -20%, ${hexToRgba(themeColor, 0.4)} 0%, transparent 70%),
                radial-gradient(circle at 100% 100%, ${hexToRgba(themeColor, 0.15)} 0%, transparent 50%),
                linear-gradient(180deg, #09090b 0%, ${bgColor} 100%)
              `
            }}
          >
            {/* Ambient micro-grid */}
            <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-size-[24px_24px]" />
            {/* Top rim glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 blur-3xl opacity-50 pointer-events-none rounded-full" style={{ backgroundColor: themeColor }} />
          </div>
        )}
        <div className="absolute inset-0" style={{background:`linear-gradient(to bottom, ${hexToRgba(themeColor, 0.1)} 0%, ${hexToRgba(bgColor, 0.6)} 65%, ${bgColor} 100%)`}}/>
        <div className="absolute top-0 left-0 right-0 h-1 shadow-sm" style={{backgroundColor:themeColor}}/>
      </div>

      <div className="relative z-10 -mt-24 px-5 max-w-2xl mx-auto">
        <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.45,ease:[0.22,1,0.36,1]}} className="flex flex-col items-center text-center">
          {logoUrl ? (
            <div className="mb-6 flex justify-center items-center h-20 sm:h-24 w-full">
              <Image src={logoUrl} alt={displayName} width={256} height={128} className={`w-auto h-full object-contain drop-shadow-2xl ${radiusClass}`}/>
            </div>
          ) : (
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 ${radiusClass} flex items-center justify-center text-2xl sm:text-3xl font-black shadow-2xl mb-4 border border-white/20 backdrop-blur-xl relative overflow-hidden text-white`}
              style={{
                backgroundColor: hexToRgba(themeColor, 0.25),
                boxShadow: `0 0 32px -4px ${hexToRgba(themeColor, 0.45)}, 0 20px 40px -15px rgba(0,0,0,0.7)`
              }}
            >
              <div className="absolute inset-0 bg-linear-to-br from-white/25 via-transparent to-black/20 pointer-events-none" />
              <span className="relative z-10 tracking-widest">{displayName.substring(0,2).toUpperCase()}</span>
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{displayName}</h1>
          {location.tagline && <p className="text-white/60 text-sm mt-1.5 max-w-xs leading-relaxed">{location.tagline}</p>}
        </motion.div>

        <motion.div 
          className={`mt-8 ${layoutMode === 'bento_grid' ? `grid grid-cols-1 sm:grid-cols-2 ${gapClass}` : layoutMode === 'masonry' ? `columns-1 sm:columns-2 ${gapClass} space-y-4` : `space-y-3 max-w-lg mx-auto`}`} 
          initial="hidden" animate="show" variants={{hidden:{},show:{transition:{staggerChildren:0.08,delayChildren:0.15}}}}
        >
          {pages.map((page,i)=>{
            const meta = getTemplateMeta(page);
            const isFirst=i===0;
            const bentoClass = (layoutMode === 'bento_grid' && isFirst) ? 'sm:col-span-2' : '';
            const masonryClass = layoutMode === 'masonry' ? 'break-inside-avoid' : '';
            const surfaceClass = getSurfaceClass(isFirst);
            
            return(
              <motion.div key={page.id} className={`${bentoClass} ${masonryClass}`} variants={{hidden:{opacity:0,y:16},show:{opacity:1,y:0,transition:springTransition}}}>
                <Link href={`/m/${location.slug}/p/${page.slug}`} className="block group h-full">
                  {isFirst?(
                    <div className={`w-full ${paddingClass} ${radiusClass} flex items-center justify-between ${onThemeText} ${surfaceClass} h-full relative overflow-hidden transition-transform duration-200 hover:scale-[1.015] active:scale-[0.99]`} style={{backgroundColor:themeColor,boxShadow: surfaceStyle !== 'flat' ? `0 8px 32px -8px ${hexToRgba(themeColor,0.5)}` : undefined}}>
                      <div className={`absolute inset-0 bg-linear-to-br from-white/10 to-transparent pointer-events-none ${radiusClass}`}/>
                      <div className="flex items-center gap-4 relative">
                        <div className={`p-2.5 ${RADIUS_MAP[liveTokens.corner_radius || 'xl'] || 'rounded-xl'} ${isLight?'bg-black/10':'bg-white/15'} backdrop-blur-sm`}>{meta.icon}</div>
                        <div>
                          <div className="font-semibold text-base leading-tight">{page.title}</div>
                          <div className={`text-xs mt-0.5 ${isLight?'text-black/60':'text-white/60'}`}>{meta.subtitle}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all relative"/>
                    </div>
                  ):(
                    <div className={`w-full ${paddingClass} ${radiusClass} ${surfaceClass} h-full flex items-center justify-between text-zinc-100 hover:bg-zinc-800/80 transition-all duration-200 hover:scale-[1.015] active:scale-[0.99]`} style={{boxShadow: surfaceStyle !== 'flat' ? `inset 0 0 0 1px ${hexToRgba(themeColor,0.15)}` : undefined}}>
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 ${RADIUS_MAP[liveTokens.corner_radius || 'xl'] || 'rounded-xl'}`} style={{backgroundColor:hexToRgba(themeColor,0.15),color:themeColor}}>{meta.icon}</div>
                        <div>
                          <div className="font-medium text-base leading-tight">{page.title}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{meta.subtitle}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all"/>
                    </div>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {hasContact&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.4}} className="mt-8 flex flex-wrap gap-3 justify-center">
            {location.address&&(
              <a href={location.google_maps_url||`https://maps.google.com?q=${encodeURIComponent(location.address)}`} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors p-2 ${radiusClass} bg-white/5`}>
                <MapPin className="w-3.5 h-3.5"/><span className="max-w-45 truncate">{location.address}</span>
              </a>
            )}
            {location.phone_number&&(
              <a href={`tel:${location.phone_number}`} className={`flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors p-2 ${radiusClass} bg-white/5`}>
                <Phone className="w-3.5 h-3.5"/>{location.phone_number}
              </a>
            )}
          </motion.div>
        )}

        {hasSocials&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}} className="mt-5 flex items-center justify-center gap-3">
              {location.instagram_handle && <a href={`https://instagram.com/${location.instagram_handle}`} target="_blank" rel="noopener noreferrer" className={`w-10 h-10 ${radiusClass} bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors`}><ExternalLink className="w-5 h-5 text-white" /></a>}
              {location.twitter_handle && <a href={`https://twitter.com/${location.twitter_handle}`} target="_blank" rel="noopener noreferrer" className={`w-10 h-10 ${radiusClass} bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors`}><ExternalLink className="w-5 h-5 text-white" /></a>}
              {location.tiktok_handle && <a href={`https://tiktok.com/@${location.tiktok_handle}`} target="_blank" rel="noopener noreferrer" className={`w-10 h-10 ${radiusClass} bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors`}><ExternalLink className="w-5 h-5 text-white" /></a>}
              {location.whatsapp_number&&<a href={`https://wa.me/${location.whatsapp_number.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className={`w-10 h-10 ${radiusClass} bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-600 transition-all`} aria-label="WhatsApp"><MessageCircle className="w-4 h-4"/></a>}
          </motion.div>
        )}

        <div className="mt-10 mb-8 text-center">
          <a href="https://ourmenuos.online" className="text-[11px] text-zinc-700 hover:text-zinc-500 transition-colors font-medium tracking-wide">Powered by OurMenu OS</a>
        </div>
      </div>
    </div>
  );
}