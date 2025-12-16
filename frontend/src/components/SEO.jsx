import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

/**
 * SEO Component
 * Manages meta tags, Open Graph, and structured data
 */

const SEO = ({
  title = 'JN Business System - Terminbuchung für Unternehmen',
  description = 'Professionelles Online-Buchungssystem für Salons, Studios und Unternehmen. Automatische Erinnerungen, Kalender-Integration und faire Preise.',
  keywords = 'Terminbuchung, Online Booking, Salon Software, Appointment Booking, Buchungssystem',
  author = 'JN Business System',
  image = '/og-image.png',
  url = 'https://jn-automation.vercel.app',
  type = 'website',
  siteName = 'JN Business System',
  locale = 'de_DE',
  structuredData = null
}) => {
  const fullTitle = title.includes('JN Business System') ? title : `${title} | JN Business System`;
  const fullUrl = url.startsWith('http') ? url : `https://jn-automation.vercel.app${url}`;
  const fullImage = image.startsWith('http') ? image : `https://jn-automation.vercel.app${image}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={fullImage} />

      {/* Structured Data (Schema.org) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

SEO.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  keywords: PropTypes.string,
  author: PropTypes.string,
  image: PropTypes.string,
  url: PropTypes.string,
  type: PropTypes.string,
  siteName: PropTypes.string,
  locale: PropTypes.string,
  structuredData: PropTypes.object
};

export default SEO;
