'use client'

import { Tables } from '../../../../../types'
import Link from "next/link";
import { motion } from 'framer-motion';
import Image from "next/image";
import { ArrowRight, Utensils, Calendar, Info, FileText, LayoutList } from "lucide-react";

function getLuminance(hex: string) {
  let r = 0, g = 0, b = 0;
  if (hex?.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex?.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  } else {
    return 0;
  }
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function PortalRenderer({
  location,
  pages,
}: {
  location: Tables<'locations'> & { organizations?: { logo_url: string | null } | null };
  pages: { id: string; slug: string; title: string; template_type: string; is_published: boolean }[];
}) {
  const themeColor = location.theme_color || '#0f7b55';
  const isLight = getLuminance(themeColor) > 0.5;
  const textColor = isLight ? 'text-zinc-950' : 'text-white';
  const iconBgColor = isLight ? 'bg-black/10' : 'bg-white/20';

  const getIcon = (templateType: string) => {
    switch (templateType) {
      case 'booking': return <Calendar className="w-5 h-5" />;
      case 'catalog': return <Utensils className="w-5 h-5" />;
      case 'info': return <Info className="w-5 h-5" />;
      case 'rate_card': return <FileText className="w-5 h-5" />;
      default: return <LayoutList className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center p-6 relative overflow-hidden">
      {/* Background styling */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: location.cover_image_url ? `url(${location.cover_image_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(20px)',
          transform: 'scale(1.1)',
          willChange: 'transform'
        }}
      />
      
      <div className="relative z-10 w-full max-w-md mt-12 flex flex-col items-center">
        {location.organizations?.logo_url ? (
          <Image 
            src={location.organizations.logo_url} 
            alt={location.name} 
            width={96}
            height={96}
            className="w-24 h-24 rounded-full object-cover border-4 border-zinc-800 shadow-xl mb-6"
            priority={true}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div 
            className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black ${textColor} shadow-xl mb-6 border-4 border-zinc-800`}
            style={{ backgroundColor: themeColor }}
          >
            {location.name.substring(0, 2).toUpperCase()}
          </div>
        )}

        <h1 className="text-3xl font-bold text-white mb-2 text-center w-full px-4 truncate">{location.name}</h1>
        {location.tagline && (
          <p className="text-zinc-400 text-center mb-8 w-full px-4 truncate">{location.tagline}</p>
        )}

        <motion.div 
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          className="w-full space-y-4"
        >
          {/* Main Menu Button */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
            <Link href={`/m/${location.slug}?view=menu`} className="block w-full group">
            <div 
              className={`w-full p-4 rounded-2xl flex items-center justify-between ${textColor} shadow-lg transition-transform hover:scale-[1.02]`}
              style={{ backgroundColor: themeColor }}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl backdrop-blur-sm ${iconBgColor}`}>
                  <Utensils className="w-6 h-6" />
                </div>
                <div className="font-semibold text-lg truncate">Main Menu</div>
              </div>
              <ArrowRight className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
            </Link>
          </motion.div>

          {/* Dynamic Pages */}
          {pages.map((page) => (
            <motion.div key={page.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
              <Link href={`/m/${location.slug}/p/${page.slug}`} className="block w-full group">
              <div className="w-full p-4 rounded-2xl bg-zinc-900/80 backdrop-blur-md border border-zinc-800 flex items-center justify-between text-zinc-100 hover:bg-zinc-800 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-zinc-800 rounded-xl text-zinc-400 group-hover:text-white transition-colors" style={{ color: location.theme_color }}>
                    {getIcon(page.template_type)}
                  </div>
                  <div className="font-medium text-lg">{page.title}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all" />
              </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
