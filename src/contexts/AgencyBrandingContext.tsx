import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AgencyBranding {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  subdomain: string;
  hide_powered_by: boolean | null;
}

interface AgencyBrandingContextType {
  branding: AgencyBranding | null;
  loading: boolean;
  error: string | null;
}

const AgencyBrandingContext = createContext<AgencyBrandingContextType>({
  branding: null,
  loading: true,
  error: null,
});

export const useAgencyBranding = () => useContext(AgencyBrandingContext);

interface Props {
  children: ReactNode;
}

export const AgencyBrandingProvider = ({ children }: Props) => {
  const [branding, setBranding] = useState<AgencyBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      // Check for agency parameter in URL
      const params = new URLSearchParams(window.location.search);
      const agencySubdomain = params.get('agency');

      if (!agencySubdomain) {
        // No agency specified, check if user is logged in as a client
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Get client's agency
          const { data: client } = await supabase
            .from('clients')
            .select('agency_id, agencies!inner(id, name, logo_url, primary_color, secondary_color, subdomain, hide_powered_by)')
            .eq('email', user.email)
            .maybeSingle();

          if (client && client.agencies) {
            setBranding(client.agencies as any);
            applyBranding(client.agencies as any);
          }
        }

        setLoading(false);
        return;
      }

      // Load agency by subdomain
      const { data, error: fetchError } = await supabase
        .from('agencies')
        .select('id, name, logo_url, primary_color, secondary_color, subdomain, hide_powered_by')
        .eq('subdomain', agencySubdomain.toLowerCase())
        .single();

      if (fetchError || !data) {
        setError('Agency not found');
        setLoading(false);
        return;
      }

      setBranding(data);
      applyBranding(data);
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading branding:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const applyBranding = (brandingData: AgencyBranding) => {
    // Apply CSS custom properties for dynamic theming
    const root = document.documentElement;

    if (brandingData.primary_color) {
      // Convert hex to HSL for proper theming
      const primaryHSL = hexToHSL(brandingData.primary_color);
      root.style.setProperty('--primary', primaryHSL);
    }

    if (brandingData.secondary_color) {
      const secondaryHSL = hexToHSL(brandingData.secondary_color);
      root.style.setProperty('--secondary', secondaryHSL);
    }

    // Update page title
    document.title = `${brandingData.name} - Content Automation`;

    // Update favicon if logo exists
    if (brandingData.logo_url) {
      const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (favicon) {
        favicon.href = brandingData.logo_url;
      }
    }
  };

  // Helper function to convert hex to HSL
  const hexToHSL = (hex: string): string => {
    // Remove # if present
    hex = hex.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    const lPercent = Math.round(l * 100);

    return `${h} ${s}% ${lPercent}%`;
  };

  return (
    <AgencyBrandingContext.Provider value={{ branding, loading, error }}>
      {children}
    </AgencyBrandingContext.Provider>
  );
};
