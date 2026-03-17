import { Helmet } from "react-helmet-async";

const SITE_NAME = "Trisandhya Ayurveda";
const DEFAULT_DESC = "Discover authentic Ayurvedic wellness products by Dr. Malavika Sadanandan. Pure, sustainable, and effective remedies sourced directly from nature.";

const SEO = ({ title, description, path }) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Natural Ayurvedic Products`;
  const desc = description || DEFAULT_DESC;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      {path && <meta property="og:url" content={path} />}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
    </Helmet>
  );
};

export default SEO;
