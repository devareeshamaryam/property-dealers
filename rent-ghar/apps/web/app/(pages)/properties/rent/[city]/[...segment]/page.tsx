 import PropertiesListing from '@/components/PropertiesListing';
import { Suspense } from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { serverApi } from '@/lib/server-api';
import { toTitleCase } from '@/lib/utils';
import { buildCollectionPageSchema } from '@/lib/schema/listing-schema';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://propertydealer.pk';

// ✅ FIX 1: Fallback property types taake API fail ho toh bhi segments match ho
const FALLBACK_TYPES = [
  'house', 'apartment', 'flat', 'plot', 'commercial',
  'office', 'shop', 'land', 'factory', 'hotel', 'restaurant', 'other',
];

interface PageProps {
  params: Promise<{
    city: string;
    segments: string[];
  }>;
}

const isMarlaSegment = (s: string) => /^\d+marla$/i.test(s);
const parseMarlaValue = (s: string) => parseInt(s.replace(/marla/i, ''), 10);

async function resolveSegments(citySlug: string, segments: string[]) {
  try {
    const cityData = await serverApi.getCityByName(citySlug);
    if (!cityData) return { cityData: null, areaData: null, propertyType: null, areaSlug: null, marla: null };

    let propertyTypes: string[] = [];
    try {
      propertyTypes = await serverApi.getTypes();
      // ✅ FIX 1: Agar API empty return kare toh fallback use karo
      if (!propertyTypes || propertyTypes.length === 0) {
        propertyTypes = FALLBACK_TYPES;
      }
    } catch {
      // ✅ FIX 1: API fail ho toh bhi fallback types se kaam chalao
      propertyTypes = FALLBACK_TYPES;
    }

    const marlaSegment   = segments.find(isMarlaSegment);
    const marla          = marlaSegment ? parseMarlaValue(marlaSegment) : null;
    const nonMarlaSegs   = segments.filter(s => !isMarlaSegment(s));

    if (nonMarlaSegs.length === 0) {
      return { cityData, areaData: null, propertyType: null, areaSlug: null, marla };
    }

    if (nonMarlaSegs.length === 1) {
      const seg = nonMarlaSegs[0] as string;
      const matchedType = propertyTypes.find(t => t.toLowerCase() === seg.toLowerCase());

      if (matchedType) {
        return { cityData, areaData: null, propertyType: matchedType, areaSlug: null, marla };
      }

      try {
        const areaData = await serverApi.getAreaBySlug(seg, cityData._id);
        return { cityData, areaData, propertyType: null, areaSlug: seg, marla };
      } catch {
        return { cityData, areaData: null, propertyType: null, areaSlug: null, marla };
      }
    }

    if (nonMarlaSegs.length >= 2) {
      const areaSeg     = nonMarlaSegs[0] as string;
      const typeSeg     = nonMarlaSegs[1] as string;
      const matchedType = propertyTypes.find(t => t.toLowerCase() === typeSeg.toLowerCase()) || null;

      try {
        const areaData = await serverApi.getAreaBySlug(areaSeg, cityData._id);
        return { cityData, areaData, propertyType: matchedType, areaSlug: areaSeg, marla };
      } catch {
        return { cityData, areaData: null, propertyType: matchedType, areaSlug: areaSeg, marla };
      }
    }

    return { cityData, areaData: null, propertyType: null, areaSlug: null, marla };
  } catch (error) {
    console.error('Error resolving segments:', error);
    return { cityData: null, areaData: null, propertyType: null, areaSlug: null, marla: null };
  }
}

export async function generateMetadata(
  props: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { city: citySlug, segments } = await props.params;
  const { cityData, areaData, propertyType } = await resolveSegments(citySlug, segments);

  const purpose  = 'Rent';
  const cityName = cityData ? toTitleCase(cityData.name) : toTitleCase(citySlug);

  const findTypeContent = (type: string) =>
    cityData?.typeContents?.find(
      (tc: any) => tc.propertyType.toLowerCase() === type.toLowerCase() &&
        (tc.purpose === 'rent' || tc.purpose === 'all')
    ) || null;

  if (areaData && propertyType) {
    const areaName = toTitleCase(areaData.name);
    const typeName = propertyType.toLowerCase() === 'house' ? 'Property' : toTitleCase(propertyType);
    return {
      title: areaData.rentMetaTitle?.trim() || areaData.metaTitle || `${typeName} for ${purpose} in ${areaName}, ${cityName}`,
      description: areaData.rentMetaDescription?.trim() || areaData.metaDescription || `Find ${typeName.toLowerCase()} for ${purpose.toLowerCase()} in ${areaName}, ${cityName}. Browse verified listings on Property Dealer.`,
      alternates: { canonical: `/properties/rent/${citySlug}/${segments.filter(s => !isMarlaSegment(s)).join('/')}` },
    };
  }

  if (areaData) {
    const areaName = toTitleCase(areaData.name);
    return {
      title: areaData.rentMetaTitle?.trim() || areaData.metaTitle || `Properties for ${purpose} in ${areaName}, ${cityName}`,
      description: areaData.rentMetaDescription?.trim() || areaData.metaDescription || `Discover properties for ${purpose.toLowerCase()} in ${areaName}, ${cityName}. View photos, prices, and details on Property Dealer.`,
      alternates: { canonical: areaData.canonicalUrl || `/properties/rent/${citySlug}/${segments[0]}` },
    };
  }

  if (propertyType) {
    const typeName = propertyType.toLowerCase() === 'house' ? 'Property' : toTitleCase(propertyType);
    const tc = findTypeContent(propertyType);
    return {
      title: tc?.metaTitle?.trim() || `${typeName} for ${purpose} in ${cityName}`,
      description: tc?.metaDescription?.trim() || `Find the best ${propertyType.toLowerCase()} for ${purpose.toLowerCase()} in ${cityName}. Browse verified listings on Property Dealer.`,
      alternates: { canonical: `/properties/rent/${citySlug}/${segments.filter(s => !isMarlaSegment(s)).join('/')}` },
    };
  }

  return { title: `Properties for ${purpose} in ${cityName}` };
}

export default async function RentCitySegmentsPage(props: PageProps) {
  const { city, segments } = await props.params;
  const { cityData, areaData, propertyType, areaSlug, marla } = await resolveSegments(city, segments);

  if (!cityData) console.error(`City ${city} not found`);

  const listingType = propertyType || 'all';
  const areaId      = areaData?._id;

  const specificContent = propertyType && !areaData
    ? cityData?.typeContents?.find(
        (tc: any) => tc.propertyType.toLowerCase() === propertyType.toLowerCase() &&
          (tc.purpose === 'rent' || tc.purpose === 'all')
      ) || null
    : null;

  const richDescription = areaData && propertyType
    ? undefined
    : areaData
      ? (areaData.rentContent?.trim() || areaData.description || undefined)
      : (specificContent?.content?.trim() ? specificContent.content : undefined);

  const cityName = cityData ? toTitleCase(cityData.name) : toTitleCase(city);
  const areaName = areaData ? toTitleCase(areaData.name) : null;
  const typeName = propertyType
    ? (propertyType.toLowerCase() === 'house' ? 'Property' : toTitleCase(propertyType))
    : null;
  const pageUrl   = `${BASE_URL}/properties/rent/${city}/${segments.join('/')}`;
  const pageTitle = [
    typeName ? (typeName === 'Property' ? 'Property' : `${typeName}s`) : 'Properties',
    'for Rent',
    areaName ? `in ${areaName}, ${cityName}` : `in ${cityName}`,
  ].join(' ');

  let schemaProperties: any[] = [];
  try {
    const params: Record<string, string> = { city, limit: '20', page: '1', purpose: 'rent' };
    if (areaId)                  params.areaId = areaId;
    if (listingType !== 'all')   params.type   = listingType;
    if (marla)                 { params.marlaMin = String(marla); params.marlaMax = String(marla); }
    const qs  = new URLSearchParams(params).toString();
    const res = await serverApi.getProperties(qs);
    const rawProps: any[] = Array.isArray(res) ? res : (res as any).properties || [];
    schemaProperties = rawProps.map((p: any) => ({ id: p._id, slug: p.slug, name: p.title }));
  } catch { /* non-critical */ }

  const nonMarlaSegs = segments.filter(s => !isMarlaSegment(s));
  const breadcrumbs = [
    { name: 'Home',                  url: `${BASE_URL}/` },
    { name: 'Properties for Rent',   url: `${BASE_URL}/properties/rent` },
    { name: cityName,                url: `${BASE_URL}/properties/rent/${city}` },
    ...(areaName ? [{ name: areaName, url: `${BASE_URL}/properties/rent/${city}/${areaSlug}` }] : []),
    ...(typeName && areaName
      ? [{ name: typeName === 'Property' ? 'Property' : `${typeName}s`, url: `${BASE_URL}/properties/rent/${city}/${areaSlug}/${nonMarlaSegs[1]}` }]
      : typeName
        ? [{ name: typeName === 'Property' ? 'Property' : `${typeName}s`, url: `${BASE_URL}/properties/rent/${city}/${nonMarlaSegs[0]}` }]
        : []),
  ];

  const collectionSchema = buildCollectionPageSchema({
    url: pageUrl, title: pageTitle, cityName,
    properties: schemaProperties.map(p => ({ title: p.name, url: `${BASE_URL}/p/${p.slug || p.id}` })),
    totalItems: schemaProperties.length,
    crumbs: breadcrumbs,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <PropertiesListing
          purpose="rent"
          city={city}
          type={listingType}
          areaId={areaId}
          areaSlug={areaSlug || undefined}
          useCleanUrls={true}
          richDescription={richDescription}
          initialMarla={marla ?? undefined}
        />
      </Suspense>
    </>
  );
}