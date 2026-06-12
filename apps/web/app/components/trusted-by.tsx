import { createClient } from '@/lib/supabase/server'
import { FadeIn } from './animations'

export async function TrustedBy() {
  const supabase = await createClient()
  
  // Fetch up to 20 organizations to populate the marquee
  const { data: orgs } = await supabase
    .from('organizations')
    .select('name, logo_url')
    .limit(20)

  // Only show the section if we have at least 5 customers
  if (!orgs || orgs.length < 5) {
    return null
  }

  // Duplicate the list a few times to ensure the marquee is wide enough to loop smoothly
  const marqueeItems = [...orgs, ...orgs, ...orgs]

  return (
    <section className="py-16 px-6 bg-[#030303] border-t border-white/[0.03] overflow-hidden">
      <FadeIn className="text-center mb-8">
        <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Trusted by leading hospitality brands</p>
      </FadeIn>
      
      {/* Marquee Container */}
      <div className="relative flex overflow-x-hidden group mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)">
        <div className="flex animate-marquee whitespace-nowrap items-center gap-16 px-8 hover:pause">
          {marqueeItems.map((org, i) => (
            <div key={`${org.name}-${i}`} className="flex items-center justify-center min-w-[120px] opacity-50 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0">
              {org.logo_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={org.logo_url} alt={org.name} className="h-8 md:h-10 object-contain" />
              ) : (
                <span className="text-xl md:text-2xl font-black tracking-tight text-white">{org.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
