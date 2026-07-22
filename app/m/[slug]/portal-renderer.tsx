'use client'

import { Tables } from '@/lib/supabase/types'
import Link from "next/link";
import { motion } from 'framer-motion';
import Image from "next/image";
import { ArrowRight, Utensils, Calendar, Info, FileText, LayoutGrid, FileSignature, ShoppingBag, Building2, MapPin, Phone, MessageCircle, ExternalLink } from "lucide-react";

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

export function PortalRenderer({location,pages}:{
  location:Tables<'locations'>&{organizations?:{
    logo_url?:string|null, 
    name?:string|null,
    portal_name?:string|null,
    portal_theme_color?:string|null,
    portal_background_color?:string|null,
    portal_cover_image_url?:string|null
  }|null};
  pages:{id:string;slug:string;title:string;template_type:string;is_published:boolean}[];
}) {
  const org = location.organizations;
  const themeColor = org?.portal_theme_color || location.theme_color || '#6d28d9';
  const bgColor = org?.portal_background_color || '#09090b'; // zinc-950
  const isLight = getLuminance(themeColor)>0.5;
  const onThemeText = isLight?'text-zinc-950':'text-white';
  const hasSocials = !!(location.instagram_handle||location.twitter_handle||location.x_handle||location.tiktok_handle||location.whatsapp_number);
  const hasContact = !!(location.address||location.phone_number);
  const logoUrl = org?.logo_url;
  const coverImageUrl = org?.portal_cover_image_url || location.cover_image_url;
  const displayName = org?.portal_name || location.portal_display_name || org?.name || location.name;

  return (
    <div className="min-h-screen font-sans overflow-x-hidden" style={{ backgroundColor: bgColor }}>
      <div className="relative h-72 sm:h-80 overflow-hidden">
        {coverImageUrl?(
          <>
            <Image src={coverImageUrl} alt={displayName} fill className="object-cover object-top" priority quality={90} sizes="100vw"/>
            {/* Dark scrim so bright photos don't wash out content below */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent" style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 50%, ${bgColor} 100%)` }}/>
          </>
        ):(
          <div className="absolute inset-0" style={{backgroundColor:themeColor,opacity:0.3}}/>
        )}
        <div className="absolute inset-0" style={{background:`linear-gradient(to bottom,${hexToRgba(themeColor,0.15)} 0%, ${hexToRgba(bgColor, 0.5)} 60%, ${bgColor} 100%)`}}/>
        <div className="absolute top-0 left-0 right-0 h-1" style={{backgroundColor:themeColor}}/>
      </div>

      <div className="relative z-10 -mt-24 px-5 max-w-lg mx-auto">
        <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.45,ease:[0.22,1,0.36,1]}} className="flex flex-col items-center text-center">
          {logoUrl?(
            <div className="mb-6 flex justify-center items-center h-20 sm:h-24 w-full">
              <Image src={logoUrl} alt={displayName} width={256} height={128} className="w-auto h-full object-contain drop-shadow-2xl"/>
            </div>
          ):(
            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black shadow-2xl mb-4 border-4 border-white/5 ${onThemeText}`} style={{backgroundColor:themeColor,boxShadow:`0 0 0 1px ${hexToRgba(themeColor,0.4)},0 20px 60px -12px ${hexToRgba(themeColor,0.4)}`}}>
              {displayName.substring(0,2).toUpperCase()}
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{displayName}</h1>
          {location.tagline&&<p className="text-white/60 text-sm mt-1.5 max-w-xs leading-relaxed">{location.tagline}</p>}
        </motion.div>

        <motion.div className="mt-8 space-y-3" initial="hidden" animate="show" variants={{hidden:{},show:{transition:{staggerChildren:0.08,delayChildren:0.15}}}}>
          {pages.map((page,i)=>{
            const meta=TEMPLATE_META[page.template_type]??TEMPLATE_META.custom;
            const isFirst=i===0;
            return(
              <motion.div key={page.id} variants={{hidden:{opacity:0,y:16},show:{opacity:1,y:0,transition:{duration:0.35,ease:[0.22,1,0.36,1]}}}}>
                <Link href={`/m/${location.slug}/p/${page.slug}`} className="block group">
                  {isFirst?(
                    <div className={`w-full p-4 rounded-2xl flex items-center justify-between ${onThemeText} shadow-lg relative overflow-hidden transition-transform duration-200 hover:scale-[1.015] active:scale-[0.99]`} style={{backgroundColor:themeColor,boxShadow:`0 8px 32px -8px ${hexToRgba(themeColor,0.5)}`}}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none rounded-2xl"/>
                      <div className="flex items-center gap-4 relative">
                        <div className={`p-2.5 rounded-xl ${isLight?'bg-black/10':'bg-white/15'} backdrop-blur-sm`}>{meta.icon}</div>
                        <div>
                          <div className="font-semibold text-base leading-tight">{page.title}</div>
                          <div className={`text-xs mt-0.5 ${isLight?'text-black/60':'text-white/60'}`}>{meta.subtitle}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all relative"/>
                    </div>
                  ):(
                    <div className="w-full p-4 rounded-2xl bg-zinc-900/80 backdrop-blur-md border border-zinc-800 flex items-center justify-between text-zinc-100 hover:bg-zinc-800/80 hover:border-zinc-700 transition-all duration-200 hover:scale-[1.015] active:scale-[0.99]" style={{boxShadow:`inset 0 0 0 1px ${hexToRgba(themeColor,0.15)}`}}>
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl" style={{backgroundColor:hexToRgba(themeColor,0.15),color:themeColor}}>{meta.icon}</div>
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
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.4}} className="mt-6 flex flex-wrap gap-3 justify-center">
            {location.address&&(
              <a href={location.google_maps_url||`https://maps.google.com?q=${encodeURIComponent(location.address)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                <MapPin className="w-3.5 h-3.5"/><span className="max-w-[180px] truncate">{location.address}</span>
              </a>
            )}
            {location.phone_number&&(
              <a href={`tel:${location.phone_number}`} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                <Phone className="w-3.5 h-3.5"/>{location.phone_number}
              </a>
            )}
          </motion.div>
        )}

        {hasSocials&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}} className="mt-5 flex items-center justify-center gap-3">
              {location.instagram_handle && <a href={`https://instagram.com/${location.instagram_handle}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"><ExternalLink className="w-5 h-5 text-white" /></a>}
              {location.twitter_handle && <a href={`https://twitter.com/${location.twitter_handle}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"><ExternalLink className="w-5 h-5 text-white" /></a>}
              {location.tiktok_handle && <a href={`https://tiktok.com/@${location.tiktok_handle}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"><ExternalLink className="w-5 h-5 text-white" /></a>}
              {location.whatsapp_number&&<a href={`https://wa.me/${location.whatsapp_number.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-600 transition-all" aria-label="WhatsApp"><MessageCircle className="w-4 h-4"/></a>}
          </motion.div>
        )}

        <div className="mt-10 mb-8 text-center">
          <a href="https://ourmenuos.online" className="text-[11px] text-zinc-700 hover:text-zinc-500 transition-colors font-medium tracking-wide">Powered by OurMenu OS</a>
        </div>
      </div>
    </div>
  );
}