import PropertiesListing from '@/components/PropertiesListing';
import { serverApi } from '@/lib/server-api';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { toTitleCase } from '@/lib/utils';

import { buildCollectionPageSchema } from '@/lib/schema/listing-schema';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://propertydealer.pk';

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const cityName = (params.city as string) || '';
  const type = (params.type as string) || '';

  const purpose = 'Rent';
  const typeName = type && type !== 'all'
    ? (type.toLowerCase() === 'house' ? 'Property' : toTitleCase(type))
    : 'Properties';
  let title = `${typeName} for ${purpose} in Pakistan `;
  let description = `Search and find ${typeName.toLowerCase()} for ${purpose.toLowerCase()} across Pakistan on Property Dealer.`;

  if (cityName) {
    try {
      const cityData = await serverApi.getCityByName(cityName);
      if (cityData) {
        const typeName = type && type !== 'all'
          ? (type.toLowerCase() === 'house' ? 'Property' : toTitleCase(type))
          : 'Properties';
        const formattedCity = toTitleCase(cityData.name);

        title = `${typeName} for ${purpose} in ${formattedCity} `;
        description = `Find the best ${typeName.toLowerCase()} for ${purpose.toLowerCase()} in ${formattedCity}. Browse the latest listings and verified properties on Property Dealer.`;

        // If city has custom meta, use it if no type is selected
        if (type === 'all' || !type) {
          if (cityData.rentMetaTitle) title = cityData.rentMetaTitle;
          if (cityData.rentMetaDescription) description = cityData.rentMetaDescription;
        } else {
          // Check for specific property type content
          const specificContent = cityData.typeContents?.find(
            (tc: any) => tc.propertyType.toLowerCase() === type.toLowerCase() && tc.purpose === 'rent'
          );
          if (specificContent?.metaTitle) title = specificContent.metaTitle;
          if (specificContent?.metaDescription) description = specificContent.metaDescription;
        }
      }
    } catch (e) {
      const formattedCity = toTitleCase(cityName);
      title = `Properties for ${purpose} in ${formattedCity} `;
    }
  }

  let path = `/properties/rent`;
  if (cityName) {
    path += `/${cityName.toLowerCase()}`;
    if (type && type !== 'all') {
      path += `/${type.toLowerCase()}`;
    }
  }

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
  };
}

export default async function RentRootPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cityName = (params.city as string) || '';
  const type = (params.type as string) || '';

  let cityRichDescription = '';
  let cityDetails: any = null;
  if (cityName) {
    try {
      cityDetails = await serverApi.getCityByName(cityName);

      const specificContent = type && type !== 'all' && cityDetails?.typeContents?.find(
        (tc: any) => tc.propertyType.toLowerCase() === type.toLowerCase() && tc.purpose === 'rent'
      );

      cityRichDescription = specificContent?.content || cityDetails?.rentContent || '';
    } catch (e) {
      console.warn('Could not fetch city content for SEO:', e);
    }
  }

  // --- Schema ---
  const typeName = type && type !== 'all'
    ? (type.toLowerCase() === 'house' ? 'Property' : toTitleCase(type))
    : 'Properties';
  const pageUrl = `${BASE_URL}/properties/rent${cityName ? `/${cityName.toLowerCase()}` : ''}${type && type !== 'all' ? `/${type.toLowerCase()}` : ''}`;
  const pageTitle = `${typeName} for Rent${cityName ? ` in ${toTitleCase(cityName)}` : ' in Pakistan'}`;

  let schemaProperties: any[] = [];
  try {
    const q = cityName ? `city=${cityName}&purpose=rent&limit=20` : 'purpose=rent&limit=20';
    const res = await serverApi.getProperties(q);
    const rawProps: any[] = Array.isArray(res) ? res : (res as any).properties || [];
    schemaProperties = rawProps.map((p: any) => ({
      id: p._id, slug: p.slug, name: p.title
    }));
  } catch { /* skip schema failing */ }

  const collectionSchema = buildCollectionPageSchema({
    url: pageUrl,
    title: pageTitle,
    cityName: cityName || 'Pakistan',
    properties: schemaProperties.map(p => ({
      title: p.name,
      url: `${BASE_URL}/p/${p.slug || p.id}`
    })),
    totalItems: schemaProperties.length,
    crumbs: [
      { name: 'Home', url: `${BASE_URL}/` },
      { name: 'Properties for Rent', url: `${BASE_URL}/properties/rent` },
      ...(cityName ? [{ name: toTitleCase(cityName), url: `${BASE_URL}/properties/rent/${cityName.toLowerCase()}` }] : [])
    ]
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
          useCleanUrls={true}
          city={cityName}
          richDescription={cityRichDescription}
        />
      </Suspense>
    </>
  );
}
