import Link from "next/link";
import { ArrowRight, Utensils, Calendar, Info, FileText, LayoutList } from "lucide-react";

export function PortalRenderer({
  location,
  pages,
}: {
  location: any;
  pages: any[];
}) {
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
          filter: 'blur(20px)'
        }}
      />
      
      <div className="relative z-10 w-full max-w-md mt-12 flex flex-col items-center">
        {location.organizations?.logo_url ? (
          <img src={location.organizations.logo_url} alt={location.name} className="w-24 h-24 rounded-full object-cover border-4 border-zinc-800 shadow-xl mb-6" />
        ) : (
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-xl mb-6 border-4 border-zinc-800"
            style={{ backgroundColor: location.theme_color || '#0f7b55' }}
          >
            {location.name.substring(0, 2).toUpperCase()}
          </div>
        )}

        <h1 className="text-3xl font-bold text-white mb-2 text-center">{location.name}</h1>
        {location.tagline && (
          <p className="text-zinc-400 text-center mb-8">{location.tagline}</p>
        )}

        <div className="w-full space-y-4">
          {/* Main Menu Button */}
          <Link href={`/m/${location.slug}?view=menu`} className="block w-full group">
            <div 
              className="w-full p-4 rounded-2xl flex items-center justify-between text-white shadow-lg transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: location.theme_color || '#0f7b55' }}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Utensils className="w-6 h-6" />
                </div>
                <div className="font-semibold text-lg">Main Menu</div>
              </div>
              <ArrowRight className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          {/* Dynamic Pages */}
          {pages.map((page) => (
            <Link key={page.id} href={`/m/${location.slug}/p/${page.slug}`} className="block w-full group">
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
          ))}
        </div>
      </div>
    </div>
  );
}
